/**
 * Serializes an SVG element to a downloadable .svg file.
 * The scale factor used for screen preview is stripped — width/height are set
 * to the exact physical mm dimensions so the file is print/CNC/3D-printing ready.
 */
export function useSvgDownload() {
  function downloadButtonSvg(
    svgEl: SVGSVGElement,
    filename = 'button-inlay.svg',
  ) {
    const clone = svgEl.cloneNode(true) as SVGSVGElement
    // Derive physical mm dimensions from the viewBox (units are already mm).
    // This removes the screen scale factor and works for any button type.
    const vb = svgEl.viewBox.baseVal
    clone.setAttribute('width', `${vb.width}mm`)
    clone.setAttribute('height', `${vb.height}mm`)

    const svgStr = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return { downloadButtonSvg }
}
