"""
Scoring service for interview answers.
Evaluates clarity, relevance, and correctness using NLP and LLM.
"""

import json
import logging
from typing import List, Dict, Tuple
from app.config import settings

try:
    import spacy
    import nltk
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk.corpus import stopwords
    nlp = spacy.load(settings.spacy_model)
except Exception as e:
    logging.warning(f"NLP models not fully loaded: {e}")
    nlp = None

try:
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
except Exception as e:
    logging.warning(f"OpenAI client not initialized: {e}")
    client = None


class ScoringService:
    """Service for scoring interview answers."""

    @staticmethod
    def calculate_clarity(transcript: str) -> Tuple[float, List[str]]:
        """
        Calculate clarity score (0-1) based on:
        - Sentence complexity
        - Vocabulary usage
        - Grammar correctness
        """
        if not transcript or len(transcript.strip()) == 0:
            return 0.0, ["Answer is empty"]
        
        try:
            doc = nlp(transcript) if nlp else None
            
            # Heuristic scoring
            word_count = len(transcript.split())
            sentence_count = len(sent_tokenize(transcript)) if 'sent_tokenize' in dir() else 1
            
            avg_sentence_length = word_count / max(sentence_count, 1)
            
            # Optimal sentence length is 10-20 words
            if 10 <= avg_sentence_length <= 25:
                clarity = 0.85
            elif 8 <= avg_sentence_length <= 30:
                clarity = 0.70
            else:
                clarity = 0.55
            
            # Boost for longer, more detailed answers
            if word_count > 100:
                clarity = min(0.95, clarity + 0.1)
            elif word_count < 20:
                clarity = max(0.2, clarity - 0.3)
            
            insights = []
            if avg_sentence_length < 8:
                insights.append("Sentences are too short - try combining related ideas")
            if word_count < 50:
                insights.append("Answer is too brief - provide more details")
            
            return round(max(0.0, min(1.0, clarity)), 2), insights
            
        except Exception as e:
            logging.error(f"Clarity calculation error: {e}")
            return 0.5, ["Unable to fully analyze clarity"]

    @staticmethod
    def calculate_relevance(transcript: str, question: str, role: str) -> Tuple[float, List[str]]:
        """
        Calculate relevance score (0-1) based on:
        - Answer addresses the question
        - Mentions key role-specific concepts
        - Stays on topic
        """
        if not transcript:
            return 0.0, ["No answer provided"]
        
        try:
            transcript_lower = transcript.lower()
            question_lower = question.lower()
            
            # Extract key terms from question
            doc_q = nlp(question_lower) if nlp else None
            doc_t = nlp(transcript_lower) if nlp else None
            
            # Simple keyword matching
            question_words = set(question_lower.split())
            transcript_words = set(transcript_lower.split())
            overlap = len(question_words & transcript_words) / max(len(question_words), 1)
            
            # Role-specific keywords
            role_keywords = {
                "frontend developer": ["react", "javascript", "ui", "css", "html", "component", "state", "props"],
                "backend developer": ["api", "database", "sql", "server", "scalability", "performance", "deployment"],
                "data scientist": ["data", "model", "analysis", "statistics", "machine learning", "visualization"],
                "devops": ["deployment", "ci/cd", "docker", "kubernetes", "infrastructure", "monitoring"],
                "product manager": ["user", "feature", "roadmap", "metrics", "stakeholder", "strategy"],
            }
            
            role_lower = role.lower()
            relevant_keywords = []
            for key_role, keywords in role_keywords.items():
                if key_role in role_lower:
                    relevant_keywords = keywords
                    break
            
            keyword_count = sum(1 for kw in relevant_keywords if kw in transcript_lower)
            keyword_relevance = keyword_count / max(len(relevant_keywords), 1) if relevant_keywords else 0.5
            
            # Combined relevance score
            relevance = (overlap * 0.4 + keyword_relevance * 0.6)
            relevance = max(0.0, min(1.0, relevance))
            
            insights = []
            if overlap < 0.3:
                insights.append("Answer doesn't directly address the question")
            if keyword_relevance < 0.3 and relevant_keywords:
                insights.append(f"Missing key concepts: {', '.join(relevant_keywords[:3])}")
            
            return round(relevance, 2), insights
            
        except Exception as e:
            logging.error(f"Relevance calculation error: {e}")
            return 0.5, ["Unable to fully analyze relevance"]

    @staticmethod
    def calculate_correctness(
        transcript: str,
        question: str,
        role: str,
        use_llm: bool = True
    ) -> Tuple[float, List[str]]:
        """
        Calculate correctness score (0-1) using:
        - Heuristic checks
        - LLM evaluation (if enabled)
        """
        if not transcript:
            return 0.0, ["No answer provided"]
        
        try:
            if use_llm and client:
                # Use GPT-4 for evaluation
                response = client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {
                            "role": "system",
                            "content": f"""You are an expert technical interviewer evaluating answers for a {role} position.
Score the answer on technical correctness (0-1).
Respond in JSON format:
{{"score": 0.75, "issues": ["issue1", "issue2"], "correct_aspects": ["aspect1", "aspect2"]}}"""
                        },
                        {
                            "role": "user",
                            "content": f"Question: {question}\n\nAnswer: {transcript}"
                        }
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
                
                result = json.loads(response.choices[0].message.content)
                correctness = result.get("score", 0.5)
                issues = result.get("issues", [])
                
                return round(max(0.0, min(1.0, float(correctness))), 2), issues
                
            else:
                # Fallback: heuristic scoring
                # Check for common mistakes or good practices mentioned
                common_good_practices = [
                    "best practice", "testing", "performance", "security",
                    "scalability", "maintainability", "documentation"
                ]
                
                transcript_lower = transcript.lower()
                good_practices_count = sum(
                    1 for practice in common_good_practices if practice in transcript_lower
                )
                
                correctness = 0.5 + (good_practices_count * 0.08)
                correctness = min(0.95, correctness)
                
                insights = []
                if good_practices_count == 0:
                    insights.append("Consider mentioning best practices and testing approaches")
                
                return round(correctness, 2), insights
                
        except Exception as e:
            logging.error(f"Correctness calculation error: {e}")
            return 0.5, ["Unable to fully analyze correctness"]

    @staticmethod
    def generate_feedback(
        transcript: str,
        question: str,
        role: str,
        scores: Dict[str, float]
    ) -> str:
        """Generate constructive feedback using LLM."""
        if not client:
            return "Unable to generate detailed feedback at this time."
        
        try:
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are a supportive technical interview coach. 
Provide 2-3 sentences of constructive feedback for a {role} candidate's answer.
Focus on actionable improvements. Be encouraging but honest."""
                    },
                    {
                        "role": "user",
                        "content": f"""Question: {question}
Answer: {transcript}
Scores - Clarity: {scores['clarity']}, Relevance: {scores['relevance']}, Correctness: {scores['correctness']}"""
                    }
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logging.error(f"Feedback generation error: {e}")
            return "Keep practicing and iterating on your answers!"

    @staticmethod
    def score_answer(
        transcript: str,
        question: str,
        role: str,
        difficulty: str,
        use_llm: bool = True
    ) -> Dict:
        """
        Complete scoring pipeline.
        Returns: {scores, total, feedback, strengths, improvements}
        """
        
        clarity_score, clarity_insights = ScoringService.calculate_clarity(transcript)
        relevance_score, relevance_insights = ScoringService.calculate_relevance(
            transcript, question, role
        )
        correctness_score, correctness_insights = ScoringService.calculate_correctness(
            transcript, question, role, use_llm
        )
        
        scores = {
            "clarity": clarity_score,
            "relevance": relevance_score,
            "correctness": correctness_score
        }
        
        total_score = sum(scores.values()) / len(scores)
        
        # Combine all improvements
        all_improvements = clarity_insights + relevance_insights + correctness_insights
        all_improvements = list(set(all_improvements))  # Remove duplicates
        
        # Strengths: aspects with good scores
        strengths = []
        if clarity_score > 0.75:
            strengths.append("Clear and well-articulated answer")
        if relevance_score > 0.75:
            strengths.append("Well-targeted to the question")
        if correctness_score > 0.75:
            strengths.append("Technically sound")
        if not strengths:
            strengths = ["You're on the right track - keep practicing!"]
        
        feedback = ScoringService.generate_feedback(transcript, question, role, scores)
        
        return {
            "scores": scores,
            "total": round(total_score, 2),
            "feedback": feedback,
            "strengths": strengths,
            "improvements": all_improvements[:3]  # Top 3 improvements
        }
