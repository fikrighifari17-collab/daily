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
