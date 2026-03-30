from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
import os
import uuid
import base64

router = APIRouter(prefix="/uploads", tags=["uploads"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image with size and type validation"""
    
    # Validate file type
    ALLOWED_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/pjpeg",  # some browsers send progressive JPEG as pjpeg
        "image/png",
        "image/gif",
        "image/webp",
    ]
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}"
        )
    
    # Read and validate file size
    MAX_SIZE = 4 * 1024 * 1024  # 4MB
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large (max {MAX_SIZE // (1024*1024)}MB)"
        )
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())
    ext = file.filename.split('.')[-1].lower() if file.filename else "jpg"
    # Ensure extension is safe
    if ext not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        ext = 'jpg'
    filename = f"{unique_id}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    try:
        with open(filepath, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Return data URL directly for immediate preview
    data_url = f"data:{file.content_type};base64,{base64.b64encode(contents).decode()}"
    
    return {
        "filename": filename,
        "url": data_url,  # Return data URL for immediate frontend preview
        "size": len(contents),
        "content_type": file.content_type
    }


@router.get("/{filename}")
async def get_image(filename: str):
    """Serve uploaded image"""
    
    # Security check - prevent directory traversal
    if ".." in filename or "/" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Return file with appropriate content type
    media_type = "image/jpeg"
    if filename.endswith(".png"):
        media_type = "image/png"
    elif filename.endswith(".gif"):
        media_type = "image/gif"
    elif filename.endswith(".webp"):
        media_type = "image/webp"
    
    return FileResponse(filepath, media_type=media_type)
