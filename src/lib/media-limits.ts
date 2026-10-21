const MB = 1024 * 1024;

/** Largest file a slide image or video upload accepts, in bytes. */
export const MAX_UPLOAD_BYTES = {
  image: 10 * MB,
  video: 200 * MB,
} as const;

export type UploadKind = keyof typeof MAX_UPLOAD_BYTES;

export const uploadKind = (mimeType: string): UploadKind =>
  mimeType.startsWith("video/") ? "video" : "image";

export const formatLimit = (kind: UploadKind) =>
  `${MAX_UPLOAD_BYTES[kind] / MB} MB`;

/** Returns an error message when the file is too large, otherwise undefined. */
export function uploadSizeError(mimeType: string, size: number) {
  const kind = uploadKind(mimeType);
  if (size <= MAX_UPLOAD_BYTES[kind]) return undefined;
  return `This ${kind} is ${(size / MB).toFixed(1)} MB. ${kind === "video" ? "Videos" : "Images"} can be up to ${formatLimit(kind)}.`;
}
