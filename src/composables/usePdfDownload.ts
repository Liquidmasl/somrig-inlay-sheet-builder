import jsPDF from 'jspdf'

const DPI = 300
const PX_PER_MM = DPI / 25.4

async function renderSvgToCanvas(
  svgEl: SVGSVGElement,
): Promise<HTMLCanvasElement> {
  const vb = svgEl.viewBox.baseVal
  const pxW = Math.ceil(vb.width * PX_PER_MM)
  const pxH = Math.ceil(vb.height * PX_PER_MM)

  const clone = svgEl.cloneNode(true) as SVGSVGElement
  clone.setAttribute('width', String(pxW))
  clone.setAttribute('height', String(pxH))

  const svgStr = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('SVG image load failed'))
    img.src = url
  })
  URL.revokeObjectURL(url)

  const canvas = document.createElement('canvas')
  canvas.width = pxW
  canvas.height = pxH
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, pxW, pxH)
  ctx.drawImage(img, 0, 0)
  return canvas
}

export function usePdfDownload() {
  async function downloadSheetPdf(
    svgEls: SVGSVGElement[],
    filename = 'sheet.pdf',
  ) {
    if (svgEls.length === 0) return

    const PAGE_W = 210
    const PAGE_H = 297
    const MARGIN = 10
    const GAP = 5

    const vb = svgEls[0].viewBox.baseVal
    const btnW = vb.width
    const btnH = vb.height

    const cols = Math.max(
      1,
      Math.floor((PAGE_W - 2 * MARGIN + GAP) / (btnW + GAP)),
    )
    const rowsPerPage = Math.max(
      1,
      Math.floor((PAGE_H - 2 * MARGIN + GAP) / (btnH + GAP)),
    )
    const btnsPerPage = cols * rowsPerPage

    const canvases = await Promise.all(svgEls.map(renderSvgToCanvas))

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    for (let i = 0; i < canvases.length; i++) {
      if (i > 0 && i % btnsPerPage === 0) doc.addPage()
      const pos = i % btnsPerPage
      const col = pos % cols
      const row = Math.floor(pos / cols)
      doc.addImage(
        canvases[i].toDataURL('image/png'),
        'PNG',
        MARGIN + col * (btnW + GAP),
        MARGIN + row * (btnH + GAP),
        btnW,
        btnH,
      )
    }

    doc.save(filename)
  }

  return { downloadSheetPdf }
}
