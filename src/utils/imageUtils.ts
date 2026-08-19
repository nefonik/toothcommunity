/**
 * Image processing & compression utility for ToothChat
 * Resizes and compresses image files into lightweight base64 data URLs for real-time messaging
 */

export interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  fileName: string;
  mimeType: string;
}

export async function processAndCompressImage(
  file: File | Blob,
  maxDimension: number = 1200,
  quality: number = 0.82
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const fileName = (file instanceof File ? file.name : "image.jpg") || "image.jpg";
    const mimeType = file.type || "image/jpeg";

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku obrazu."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Nieprawidłowy format obrazu."));
      img.onload = () => {
        let { width, height } = img;

        // Calculate scaled dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Nie można zainicjalizować canvas"));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        let outputDataUrl: string;
        try {
          outputDataUrl = canvas.toDataURL("image/webp", quality);
          if (!outputDataUrl.startsWith("data:image/webp")) {
            outputDataUrl = canvas.toDataURL("image/jpeg", quality);
          }
        } catch {
          outputDataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        // Calculate approx size in bytes
        const base64Len = outputDataUrl.length - (outputDataUrl.indexOf(",") + 1);
        const sizeBytes = Math.floor((base64Len * 3) / 4);

        resolve({
          dataUrl: outputDataUrl,
          width,
          height,
          sizeBytes,
          fileName,
          mimeType,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable string (e.g. 145 KB, 1.2 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
