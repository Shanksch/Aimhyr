from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class ScoreDetail(BaseModel):
    """Score breakdown for an answer."""
    clarity: float = Field(..., ge=0, le=1, description="0-1 score for answer clarity")
    relevance: float = Field(..., ge=0, le=1, description="0-1 score for relevance to question")
    correctness: float = Field(..., ge=0, le=1, description="0-1 score for technical correctness")


class ScoreRequest(BaseModel):
    """Request to score an interview answer."""
    transcript: str = Field(..., description="Transcribed text of the answer")
    question: str = Field(..., description="The question that was asked")
    role: str = Field(..., description="Job role (e.g., 'Frontend Developer')")
    difficulty: str = Field(..., description="Difficulty level (e.g., 'Medium')")


class ScoreResponse(BaseModel):
    """Detailed scoring response."""
    scores: ScoreDetail
    total: float = Field(..., ge=0, le=1, description="Average of all scores")
    feedback: str = Field(..., description="Constructive feedback on the answer")
    strengths: List[str] = Field(..., description="What was done well")
    improvements: List[str] = Field(..., description="Areas for improvement")


class QuestionGenerationRequest(BaseModel):
    """Request to generate a follow-up question."""
    original_question: str = Field(..., description="The original question asked")
    answer_transcript: str = Field(..., description="The answer provided by candidate")
    role: str = Field(..., description="Job role")
    difficulty: str = Field(..., description="Difficulty level")
    followup_count: int = Field(default=1, description="Number of followups already used")


class QuestionGenerationResponse(BaseModel):
    """Generated follow-up question."""
    question_id: str = Field(..., description="Unique question ID")
    question_text: str = Field(..., description="The generated follow-up question")
    type: str = Field(..., description="Type: 'followup' or 'clarification'")
    reasoning: str = Field(..., description="Why this follow-up was generated")


class MainQuestionsRequest(BaseModel):
    """Request for main interview questions."""
    role: str = Field(..., description="Job role")
    difficulty: str = Field(..., description="Difficulty level (Easy, Medium, Hard)")


class MainQuestionsResponse(BaseModel):
    """Collection of main interview questions."""
    questions: List[Dict[str, str]] = Field(
        ..., 
        description="List of questions with id and text"
    )
    total_count: int = Field(..., description="Total number of questions")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    timestamp: str
