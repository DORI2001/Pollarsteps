from fastapi import APIRouter, Depends
from app.schemas.ai import ChroniclerRequest, ChroniclerResponse
from app.services.ai_chronicler import enrich_entry
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["ai-chronicler"])


@router.post("/chronicler", response_model=ChroniclerResponse)
async def chronicler(payload: ChroniclerRequest, current_user=Depends(get_current_user)):
    return await enrich_entry(payload)
