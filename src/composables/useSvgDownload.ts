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
    // Override dimensions to physical mm — remove the screen scale factor
    clone.setAttribute('width', '41.2mm')
    clone.setAttribute('height', '71.9mm')

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
