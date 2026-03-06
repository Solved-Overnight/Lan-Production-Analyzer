/**
 * Compresses an image file before sending it to the AI to prevent timeouts and payload limits.
 */
export async function compressImage(base64: string, mimeType: string, maxWidth = 1000, quality = 0.4): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Apply contrast and brightness enhancement for better OCR
      // This helps the AI distinguish text from background noise
      ctx.filter = 'contrast(1.2) brightness(1.05) saturate(0)'; // Grayscale + contrast boost
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as JPEG for best compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve({
        base64: compressedBase64.split(',')[1],
        mimeType: 'image/jpeg'
      });
    };
    img.onerror = (err) => reject(err);
    img.src = `data:${mimeType};base64,${base64}`;
  });
}
