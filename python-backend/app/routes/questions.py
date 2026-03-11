"""Question generation endpoints."""

import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    MainQuestionsRequest,
    MainQuestionsResponse,
    QuestionGenerationRequest,
    QuestionGenerationResponse
)
from app.services.questions import QuestionGenerationService

router = APIRouter(prefix="/api", tags=["questions"])

logger = logging.getLogger(__name__)


@router.post("/questions/main", response_model=MainQuestionsResponse)
async def get_main_questions(request: MainQuestionsRequest):
    """
    Get main interview questions for a role and difficulty level.
    
    - **role**: Job role (e.g., Frontend Developer, Backend Developer)
    - **difficulty**: Difficulty level (Easy, Medium, Hard)
    """
    try:
        questions = QuestionGenerationService.get_main_questions(
            role=request.role,
            difficulty=request.difficulty
        )
        
        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate questions")
        
        return MainQuestionsResponse(
            questions=questions,
            total_count=len(questions)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting main questions: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving questions")


@router.post("/questions/followup", response_model=QuestionGenerationResponse)
async def generate_followup(request: QuestionGenerationRequest):
    """
    Generate a follow-up question based on the candidate's answer.
    
    - **original_question**: The question that was asked
    - **answer_transcript**: The candidate's answer
    - **role**: Job role
    - **difficulty**: Difficulty level
    - **followup_count**: Number of follow-ups already used for this question
    """
    try:
        if not request.answer_transcript.strip():
            raise HTTPException(status_code=400, detail="Answer transcript cannot be empty")
        
        followup = QuestionGenerationService.generate_followup(
            original_question=request.original_question,
            answer_transcript=request.answer_transcript,
            role=request.role,
            difficulty=request.difficulty,
            followup_count=request.followup_count
        )
        
        return QuestionGenerationResponse(**followup)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating followup: {e}")
        raise HTTPException(status_code=500, detail="Error generating follow-up question")


@router.get("/roles")
async def get_available_roles():
    """Get list of available interview roles."""
    try:
        roles = QuestionGenerationService.get_available_roles()
        descriptions = QuestionGenerationService.get_role_descriptions()
        
        return {
            "roles": roles,
            "descriptions": descriptions
        }
        
    except Exception as e:
        logger.error(f"Error retrieving roles: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving roles")
