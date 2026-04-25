from fastapi import APIRouter

from ..schemas import AssessRequest, AssessResponse
from ..services.ai import assess_breach

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/assess-breach", response_model=AssessResponse)
def assess(req: AssessRequest) -> AssessResponse:
    return AssessResponse(assessment=assess_breach(req.user_message))
