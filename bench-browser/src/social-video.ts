export type ViewportSize = {
  width: number;
  height: number;
};

export type ClipRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function expandViewportToFitClip(
  viewport: ViewportSize,
  clip: ClipRect,
): ViewportSize {
  return {
    width: Math.max(viewport.width, Math.ceil(clip.x + clip.width)),
    height: Math.max(viewport.height, Math.ceil(clip.y + clip.height)),
  };
}

export function buildTimestampedName(
  baseName: string,
  date = new Date(),
): string {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${baseName}-${year}${month}${day}-${hours}${minutes}${seconds}`;
}
