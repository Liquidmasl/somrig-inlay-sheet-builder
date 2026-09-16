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

Core-spec only, no vendor metadata:

```xml
<basematerials id="1">
  <base name="#FF0000" displaycolor="#FF0000" />
</basematerials>
<object id="3" name="Inlay #FF0000" type="model" pid="1" pindex="0"> … </object>
```

- Resource ids share **one namespace** with objects — `basematerials` takes id 1,
  objects start at 2.
- Bambu Studio reads `displaycolor` and matches it to the loaded filaments by RGB
  distance (2.5+ converts it into colour painting rather than per-part filament).
  Slicers that ignore materials still get one part per colour to assign by hand.
- All meshes are wrapped in a `<components>` object so the slicer keeps them as
  parts of one printable object rather than scattering them across the plate.

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
