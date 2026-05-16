/**
 * Image upload endpoint.
 */
import {
  API_BASE,
  UPLOAD_TIMEOUT,
  createApiError,
  request,
} from "./client";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const uploadsApi = {
  async uploadImage(file: File): Promise<string> {
    if (!file) {
      throw createApiError("File required", 400, "MISSING_FILE");
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw createApiError("File too large (max 4MB)", 400, "FILE_TOO_LARGE");
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw createApiError(
        "Invalid file type (PNG, JPG, GIF, WebP only)",
        400,
        "INVALID_FILE_TYPE"
      );
    }

    const formData = new FormData();
    formData.append("file", file);

    const data = await request<{ url?: string }>({
      method: "POST",
      path: "/uploads/image",
      body: formData,
      timeout: UPLOAD_TIMEOUT,
      errorPrefix: "UPLOAD",
      fallbackMessage: "Image upload failed",
    });

    if (!data?.url) throw new Error("Invalid response from server");
    if (data.url.startsWith("data:")) return data.url;
    return `${API_BASE}${data.url}`;
  },
};
