import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export type ExportElementToPdfOptions = {
  element: HTMLElement
  filename: string
  marginMm?: number
  scale?: number
  onClone?: (clonedDocument: Document) => void
}

export async function exportElementToPdf({
  element,
  filename,
  marginMm = 10,
  scale = 2,
  onClone,
}: ExportElementToPdfOptions) {
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    onclone: onClone,
  })

  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const contentWidth = pageWidth - marginMm * 2
  const contentHeight = pageHeight - marginMm * 2

  const imageData = canvas.toDataURL("image/png")
  const imageHeight = (canvas.height * contentWidth) / canvas.width

  let heightLeft = imageHeight
  let position = marginMm

  pdf.addImage(imageData, "PNG", marginMm, position, contentWidth, imageHeight)
  heightLeft -= contentHeight

  while (heightLeft > 0) {
    position = marginMm - (imageHeight - heightLeft)
    pdf.addPage()
    pdf.addImage(imageData, "PNG", marginMm, position, contentWidth, imageHeight)
    heightLeft -= contentHeight
  }

  pdf.save(filename)
}
