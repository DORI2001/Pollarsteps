from __future__ import annotations
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from pathlib import Path
import uuid
import base64
import mimetypes

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_SIZE = 4 * 1024 * 1024  # 4 MB

# Maps magic-byte detected MIME type → file extension
_MIME_TO_EXT: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png":  "png",
    "image/gif":  "gif",
    "image/webp": "webp",
}

ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset({
    "image/jpeg", "image/jpg", "image/pjpeg",
    "image/png", "image/gif", "image/webp",
})


def _detect_mime(data: bytes) -> str | None:
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}",
        )

    contents = await file.read()

    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large (max {MAX_SIZE // (1024 * 1024)}MB)",
        )

    mime = _detect_mime(contents)
    if mime is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match a supported image format (JPEG, PNG, GIF, WebP)",
        )

    ext = _MIME_TO_EXT[mime]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename

    try:
        filepath.write_bytes(contents)
    except OSError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {e}",
        )

    data_url = f"data:{mime};base64,{base64.b64encode(contents).decode()}"
    return {"filename": filename, "url": data_url, "size": len(contents), "content_type": mime}


@router.get("/{filename}")
async def get_image(filename: str):
    filepath = (UPLOAD_DIR / filename).resolve()

    if not filepath.is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")

    if not filepath.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    media_type = mimetypes.guess_type(filename)[0] or "image/jpeg"
    return FileResponse(str(filepath), media_type=media_type)
