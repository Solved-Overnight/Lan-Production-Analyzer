import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Converts a PDF file (base64) to a single high-quality image (base64).
 * This allows us to apply image filters (like contrast) to PDFs before AI extraction.
 */
export async function pdfToImage(base64: string): Promise<{ base64: string; mimeType: string }> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: atob(base64) });
    const pdf = await loadingTask.promise;
    
    // We only process the first page for now, as most reports are single-page
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // Optimized scale for speed vs detail
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error("Could not get canvas context");
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas, // Required in newer versions of pdfjs-dist
    };
    
    await page.render(renderContext).promise;
    
    // Convert to high-quality JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return {
      base64: dataUrl.split(',')[1],
      mimeType: 'image/jpeg'
    };
  } catch (error) {
    console.error("PDF to Image conversion failed:", error);
    throw new Error("Failed to process PDF. Please ensure it's a valid document.");
  }
}
