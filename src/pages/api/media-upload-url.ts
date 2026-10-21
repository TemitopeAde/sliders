import { auth } from "@wix/essentials";
import { files } from "@wix/media";
import { z } from "zod";
import { ApiError, body, route } from "../../lib/api/server";
import { uploadSizeError } from "../../lib/media-limits";

const generateResumableUploadUrl = auth.elevate(
  files.generateFileResumableUploadUrl,
);

const uploadRequestSchema = z.object({
  mimeType: z
    .string()
    .max(100)
    .refine((value) => /^(image|video)\//.test(value)),
  fileName: z.string().min(1).max(1000),
  size: z.number().int().positive(),
});

export const POST = route(async ({ request }) => {
  const { mimeType, fileName, size } = uploadRequestSchema.parse(
    await body(request),
  );
  const tooLarge = uploadSizeError(mimeType, size);
  if (tooLarge) throw new ApiError(413, "FILE_TOO_LARGE", tooLarge);
  const { uploadUrl, uploadToken } = await generateResumableUploadUrl(
    mimeType,
    {
      fileName,
      uploadProtocol: "TUS",
    },
  );
  if (!uploadUrl || !uploadToken)
    throw new ApiError(
      502,
      "UPLOAD_URL_UNAVAILABLE",
      "Wix did not return a resumable upload URL.",
    );
  return { uploadUrl, uploadToken };
});
