# 3MF Export Deep-Dive

`src/composables/use3mfDownload.ts` — per-button export, triggered from `App.vue`.

## Pipeline

1. Fetch `public/models/<buttonType>_front_plate.stl` (binary STL) → plate triangles.
2. Walk the **live** SVG DOM of the selected button card (`getScreenCTM`,
   `getPointAtLength`, `getComputedStyle` all need a rendered element — the export
   cannot run against a detached or `display:none` SVG).
3. Bucket every outline by its paint colour (`fill`, or `stroke` for separator lines).
4. Union within a bucket, then subtract every *later* bucket (SVG paint order:
   a later element covers an earlier one) so no two colours claim the same volume.
5. Extrude each bucket to Z −0.4..0 and emit one 3MF object per colour.

## Colour carrying

3MF **materials extension**, not core-spec base materials:

```xml
<model … xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <m:colorgroup id="1">
    <m:color color="#FF0000" />
  </m:colorgroup>
  <object id="3" name="Inlay #FF0000" type="model" pid="1" pindex="0"> … </object>
```

- **`<basematerials>` does not work.** Bambu Studio's importer
  (`src/libslic3r/Format/bbs_3mf.cpp`) only knows `m:colorgroup` / `m:color`;
  it has no `basematerials` tag at all, so a core-spec material import lands as
  plain white. This was shipped once and had to be corrected — don't go back.
- Bambu records a triangle colour for every triangle of an object that carries
  `pid`, falling back to the object's `pindex` when the triangle has no `p1`.
  It then maps each **distinct colour string** to an extruder slot (2.5+ routes
  this through the "Standard 3MF Import color" dialog).
- 6-digit hex only. Slic3r-derived colour parsers expect `#RRGGBB` and fall back
  to white on an 8-digit value.
- Resource ids share **one namespace** with objects — the colour group takes id 1,
  objects start at 2.
- All meshes are wrapped in a `<components>` object so the slicer keeps them as
  parts of one printable object rather than scattering them across the plate.
- Do **not** add `requiredextensions="m"` — slicers without the extension would
  refuse the file instead of ignoring the colours.
- Fallback if a Bambu version ignores the colour group: vendor route, a
  `Metadata/model_settings.config` with per-part `<metadata key="extruder">` plus
  a `BambuStudio:3mfVersion` metadata entry (which flips the importer into its
  own-project path). Vendor-specific, so only if the standard route fails.

## Invariants worth keeping

- Plate and icon objects deliberately **overlap** in Z −0.4..0 (icons embedded in
  the face) so the printed surface stays flat. Icon colour groups must **never**
  overlap each other — overlapping volumes of different colours slice into a smudge.
- Every emitted mesh must be watertight. `tests/e2e/3mf-export.spec.ts` asserts
  this via directed-edge parity; run it after touching the geometry code.

## Testing

Export only works in a browser, so coverage is e2e:
`npx playwright test 3mf-export`. The spec seeds `localStorage`
(`button-customizer-state-v1`), captures the download, unzips with `fflate`, and
asserts on `3D/3dmodel.model`.
