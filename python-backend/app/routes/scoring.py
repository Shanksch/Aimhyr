"""Scoring endpoints."""

import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import ScoreRequest, ScoreResponse
from app.services.scoring import ScoringService

router = APIRouter(prefix="/api", tags=["scoring"])

logger = logging.getLogger(__name__)


@router.post("/score", response_model=ScoreResponse)
async def score_answer(request: ScoreRequest):
    """
    Score an interview answer.
    
    - **transcript**: The answer text
    - **question**: The question that was asked
    - **role**: The job role (e.g., Frontend Developer)
    - **difficulty**: Difficulty level (Easy, Medium, Hard)
    """
    try:
        if not request.transcript.strip():
            raise HTTPException(status_code=400, detail="Transcript cannot be empty")
        
        result = ScoringService.score_answer(
            transcript=request.transcript,
            question=request.question,
            role=request.role,
            difficulty=request.difficulty,
            use_llm=True
        )
        
        return ScoreResponse(
            scores={
                "clarity": result["scores"]["clarity"],
                "relevance": result["scores"]["relevance"],
                "correctness": result["scores"]["correctness"]
            },
            total=result["total"],
            feedback=result["feedback"],
            strengths=result["strengths"],
            improvements=result["improvements"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scoring error: {e}")
        raise HTTPException(status_code=500, detail="Error scoring answer")


@router.post("/score/batch")
async def score_batch(requests: list[ScoreRequest]):
    """
    Score multiple answers in batch.
    """
    try:
        results = []
        for req in requests:
            result = ScoringService.score_answer(
                transcript=req.transcript,
                question=req.question,
                role=req.role,
                difficulty=req.difficulty,
                use_llm=False  # Disable LLM for batch to save costs
            )
            results.append(result)
        
        return {"results": results, "count": len(results)}
        
    except Exception as e:
        logger.error(f"Batch scoring error: {e}")
        raise HTTPException(status_code=500, detail="Error in batch scoring")
