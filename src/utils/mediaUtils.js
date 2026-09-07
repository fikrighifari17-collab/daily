/**
 * Utility functions for handling media attachments (Photos & Videos)
 */

export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    url.startsWith('data:video') ||
    url.startsWith('blob:') ||
    /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i.test(url)
  );
}

/**
 * Client-side image compression using off-screen HTML5 Canvas.
 * Automatically resizes large phone camera photos (typically 4000x3000px, 3-10MB)
 * to max 1200px width with 80% JPEG quality (~100-200KB), reducing payload by >90%.
 */
export function compressImageFile(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Invalid image file'));
    }

    // If it's not an image, resolve directly with standard FileReader
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Scale proportionally if width exceeds maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target.result);
        }

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
