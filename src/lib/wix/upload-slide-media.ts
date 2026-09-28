import { files } from "@wix/media";
import * as tus from "tus-js-client";

type UploadedMedia = { url: string; name: string };

export async function uploadSlideMedia(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadedMedia> {
  if (!file.size) throw new Error("Choose a nonempty file.");
  if (!file.type)
    throw new Error("The selected file has no recognized media type.");

  const { uploadUrl, uploadToken } = await files.generateFileResumableUploadUrl(
    file.type,
    {
      fileName: file.name,
      uploadProtocol: "TUS",
    },
  );
  if (!uploadUrl || !uploadToken)
    throw new Error("Wix did not return a resumable upload URL.");

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: uploadUrl,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      removeFingerprintOnSuccess: true,
      metadata: {
        filename: file.name,
        contentType: file.type,
        token: uploadToken,
      },
      onError: reject,
      onProgress: (uploaded, total) =>
        onProgress(Math.round((uploaded / total) * 100)),
      onSuccess: () => resolve(),
    });
    upload.start();
  });

  const finalUrl = `${uploadUrl.replace(/\/$/, "")}/${encodeURIComponent(uploadToken)}`;
  const response = await fetch(
    `${finalUrl}?filename=${encodeURIComponent(file.name)}`,
    {
      method: "PUT",
    },
  );
  if (!response.ok)
    throw new Error(`Wix could not finalize the upload (${response.status}).`);
  const result: unknown = await response.json();
  const media = result as { file?: { url?: unknown; displayName?: unknown } };
  if (typeof media.file?.url !== "string" || !media.file.url)
    throw new Error("Wix did not return a media URL for the uploaded file.");
  return {
    url: media.file.url,
    name:
      typeof media.file.displayName === "string"
        ? media.file.displayName
        : file.name,
  };
}
