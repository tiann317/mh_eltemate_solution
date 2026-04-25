from fastapi import APIRouter

from ..schemas import AssessRequest, AssessResponse, LdaRequest, LdaResponse
from ..services.ai import assess_breach
from ..services.lda import query_lda

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/assess-breach", response_model=AssessResponse)
async def assess(req: AssessRequest) -> AssessResponse:
    parsed = await assess_breach(req.user_message)
    return AssessResponse(assessment=parsed)


@router.post("/query-lda", response_model=LdaResponse)
async def lda(req: LdaRequest) -> LdaResponse:
    d = await query_lda(req.prompt)
    return LdaResponse(**d)
