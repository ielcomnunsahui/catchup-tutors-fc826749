/** Google Drive / Docs URL helpers.
 *  Stored links come in many shapes (/view?usp=drive_link, open?id=, uc?id=,
 *  docs.google.com/document/d/…). These helpers normalise them so the in-app
 *  viewer and download buttons always work. */

/** Extract the Drive file id from any common Drive/Docs URL shape. */
export function driveId(url: string): string {
  if (!url) return "";
  return (
    url.match(/\/file\/d\/([\w-]{10,})/)?.[1] ??
    url.match(/\/(?:document|presentation|spreadsheets)\/d\/([\w-]{10,})/)?.[1] ??
    url.match(/[?&]id=([\w-]{10,})/)?.[1] ??
    url.match(/\/d\/([\w-]{10,})/)?.[1] ??
    ""
  );
}

const isFolder = (url: string) => /drive\.google\.com\/drive\/folders\//.test(url);

/** Canonical shareable link (what we store in the database). */
export function normalizeDriveUrl(url: string | null | undefined): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;
  if (isFolder(raw)) return raw.split("?")[0];
  const id = driveId(raw);
  return id ? `https://drive.google.com/file/d/${id}/view` : raw;
}

/** Embeddable preview URL for the in-app PDF viewer. */
export function drivePreview(url: string): string {
  if (isFolder(url)) return url;
  const id = driveId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}

/** Direct download URL (falls back to the original link). */
export function driveDownload(url: string): string {
  if (isFolder(url)) return url;
  const id = driveId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

/** Link that always opens correctly in a new tab (never a dead /view?usp=… link). */
export function driveOpen(url: string): string {
  return normalizeDriveUrl(url) ?? url;
}

/** True when the URL points at Google Drive at all. */
export const isDriveUrl = (url: string) => /(?:drive|docs)\.google\.com/.test(url ?? "");
