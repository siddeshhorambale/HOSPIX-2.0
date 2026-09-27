from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_parser import parse_requirement_prompt

router = APIRouter(prefix="/ai", tags=["AI Requirement Parser"])

class ParseRequirementRequest(BaseModel):
    prompt: str

@router.post("/parse-requirement")
async def parse_requirement(payload: ParseRequirementRequest):
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    result = await parse_requirement_prompt(payload.prompt)
    return result
