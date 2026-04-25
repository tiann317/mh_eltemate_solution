from fastapi import APIRouter, HTTPException

from ..schemas import AssessRequest, AssessResponse
from ..services.ai import assess_breach

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/assess-breach", response_model=AssessResponse)
def assess(req: AssessRequest) -> AssessResponse:
    try:
        result = assess_breach(req.user_message)
    except Exception as e:
        raise HTTPException(502, f"LDA assessment failed: {e}")
    return AssessResponse(**result)
