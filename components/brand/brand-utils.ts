export function compressLogoImage(file: File, maxDimension = 400, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.FileReader || !window.HTMLCanvasElement) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onerror = () => resolve(file);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/webp",
            quality
          );
        } catch (err) {
          resolve(file);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Safely converts any hex color (3-digit or 6-digit) to an 8-digit hex with alpha,
 * ensuring no invalid CSS strings are generated when users type shorthand hex codes.
 */
export function hexWithAlpha(color: string, alphaRatio: number): string {
  if (!color || typeof color !== "string") return "#0066B2";
  const trimmed = color.trim();
  const clampedRatio = Math.max(0, Math.min(1, alphaRatio));
  const alphaHex = Math.round(clampedRatio * 255).toString(16).padStart(2, "0");

  if (trimmed.startsWith("#")) {
    const raw = trimmed.slice(1);
    if (raw.length === 3) {
      const expanded = raw.split("").map((c) => c + c).join("");
      return `#${expanded}${alphaHex}`;
    }
    if (raw.length === 6) {
      return `#${raw}${alphaHex}`;
    }
    if (raw.length === 8) {
      return `#${raw.slice(0, 6)}${alphaHex}`;
    }
  }

  // Fallback default brand color with alpha
  return `#0066B2${alphaHex}`;
}

export const PRESET_COLORS = [
  { name: "Ocean Blue", hex: "#0066B2" },
  { name: "Royal Violet", hex: "#7C3AED" },
  { name: "Emerald Growth", hex: "#10B981" },
  { name: "Rose Crimson", hex: "#F43F5E" },
  { name: "Amber Glow", hex: "#F59E0B" },
  { name: "Midnight Obsidian", hex: "#0F172A" },
];
