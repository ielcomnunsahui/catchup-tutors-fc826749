import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/** Render a DOM node to an A4 PDF. Returns { blob, base64 } (base64 without data-uri prefix). */
export async function renderLetterPdf(node: HTMLElement, fileName: string) {
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 48;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight - 48) {
    pdf.addImage(imgData, "JPEG", 24, 24, imgWidth, imgHeight);
  } else {
    // Multi-page fallback: slice the canvas into page-sized chunks.
    const pxPerPt = canvas.width / imgWidth;
    const pageHeightPx = (pageHeight - 48) * pxPerPt;
    let y = 0;
    let first = true;
    while (y < canvas.height) {
      const sliceH = Math.min(pageHeightPx, canvas.height - y);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d")!;
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      const data = slice.toDataURL("image/jpeg", 0.95);
      const h = sliceH / pxPerPt;
      if (!first) pdf.addPage();
      pdf.addImage(data, "JPEG", 24, 24, imgWidth, h);
      first = false;
      y += sliceH;
    }
  }

  const blob = pdf.output("blob") as Blob;
  const dataUri = pdf.output("datauristring") as string;
  const base64 = dataUri.split(",")[1] ?? "";
  const download = () => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  return { blob, base64, download, fileName };
}
