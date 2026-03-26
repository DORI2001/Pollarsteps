import httpx
from app.core.config import get_settings
from app.schemas.ai import ChroniclerRequest, ChroniclerResponse

settings = get_settings()


async def enrich_entry(payload: ChroniclerRequest) -> ChroniclerResponse:
    if not settings.ai_chronicler_url:
        # Stubbed response when no AI endpoint configured
        return ChroniclerResponse(poetic_journal=f"At {payload.location_name}, time stood still.")

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(settings.ai_chronicler_url, json=payload.model_dump())
        resp.raise_for_status()
        data = resp.json()
        return ChroniclerResponse(**data)
