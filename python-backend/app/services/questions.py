"""
Question generation service.
Generates main interview questions and follow-up questions using LLM.
"""

import json
import logging
import uuid
from typing import List, Dict
from app.config import settings

try:
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
except Exception as e:
    logging.warning(f"OpenAI client not initialized: {e}")
    client = None


# Pre-defined main questions by role and difficulty
MAIN_QUESTIONS = {
    "Frontend Developer": {
        "Easy": [
            "Can you explain what React hooks are and provide an example of useState?",
            "What is the difference between CSS Flexbox and CSS Grid?",
            "How would you optimize the performance of a React application?",
            "Explain the concept of component props and state in React.",
            "What are the different ways to style components in React?",
            "How do you handle form submissions in a web application?"
        ],
        "Medium": [
            "Design a component tree for a real-time chat application.",
            "How would you implement memoization in React to improve performance?",
            "Explain the virtual DOM and how React uses it for rendering.",
            "How would you handle asynchronous operations in a React application?",
            "What are the best practices for managing component state at scale?",
            "How do you implement routing in a single-page application?"
        ],
        "Hard": [
            "Design a scalable architecture for a real-time collaborative editing platform.",
            "How would you implement server-side rendering (SSR) with React and optimize it?",
            "Explain micro-frontends and discuss trade-offs of different approaches.",
            "How would you implement an efficient state management solution for a large application?",
            "Design a component library with proper documentation and versioning.",
            "How would you approach debugging performance issues in a production React app?"
        ]
    },
    "Backend Developer": {
        "Easy": [
            "Explain the difference between SQL and NoSQL databases.",
            "What is RESTful API design and what are its core principles?",
            "How would you optimize a slow database query?",
            "Explain the concept of authentication and authorization.",
            "What is caching and why is it important in backend systems?",
            "How do you handle errors in an API?"
        ],
        "Medium": [
            "Design a scalable API architecture for an e-commerce platform.",
            "How would you implement rate limiting and request throttling?",
            "Explain database indexing and when to use it.",
            "How do you ensure data consistency in a distributed system?",
            "What is message queuing and how is it used in backend systems?",
            "How would you implement pagination for large datasets?"
        ],
        "Hard": [
            "Design a microservices architecture for a large-scale social media platform.",
            "How would you implement ACID transactions in a distributed system?",
            "Explain the CAP theorem and its implications for system design.",
            "How would you approach building a real-time notification system?",
            "Design a fault-tolerant system that can handle millions of requests per second.",
            "How would you implement eventual consistency in your system?"
        ]
    },
    "Data Scientist": {
        "Easy": [
            "Explain the difference between training, validation, and test sets.",
            "What is overfitting and how do you prevent it?",
            "Explain the purpose of feature scaling and normalization.",
            "What are common evaluation metrics for classification problems?",
            "How do you handle missing data in a dataset?",
            "Explain the difference between regression and classification."
        ],
        "Medium": [
            "Design an end-to-end machine learning pipeline for predicting customer churn.",
            "How would you approach feature engineering for a new problem?",
            "Explain cross-validation and its importance in model evaluation.",
            "What is the difference between L1 and L2 regularization?",
            "How would you handle imbalanced datasets?",
            "Explain hyperparameter tuning and different strategies for it."
        ],
        "Hard": [
            "Design and implement an end-to-end deep learning pipeline for image classification.",
            "How would you approach building a recommendation system at scale?",
            "Explain ensemble methods and when to use them.",
            "How would you interpret and explain predictions from a complex neural network?",
            "Design a real-time machine learning system with continuous learning.",
            "How would you approach A/B testing a machine learning model in production?"
        ]
    }
}


class QuestionGenerationService:
    """Service for generating interview questions."""

    @staticmethod
    def get_main_questions(role: str, difficulty: str) -> List[Dict[str, str]]:
        """
        Get main interview questions for a role and difficulty.
        Falls back to LLM generation if pre-defined questions aren't available.
        """
        
        # Try to return pre-defined questions
        if role in MAIN_QUESTIONS and difficulty in MAIN_QUESTIONS[role]:
            questions = MAIN_QUESTIONS[role][difficulty]
            return [
                {"id": str(uuid.uuid4()), "text": q, "kind": "main"}
                for q in questions
            ]
        
        # Fallback: Generate using LLM
        return QuestionGenerationService.generate_main_questions_llm(role, difficulty)

    @staticmethod
    def generate_main_questions_llm(role: str, difficulty: str, count: int = 6) -> List[Dict[str, str]]:
        """Generate main questions using LLM."""
        
        if not client:
            logging.warning("OpenAI client not available, returning empty questions")
            return []
        
        try:
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are an expert technical interviewer. Generate {count} interview questions for a {role} position at {difficulty} difficulty level.
Return ONLY a valid JSON array with this format:
[
  {{"text": "question 1"}},
  {{"text": "question 2"}}
]"""
                    },
                    {
                        "role": "user",
                        "content": f"Generate {count} {difficulty} interview questions for a {role}."
                    }
                ],
                temperature=0.8,
                max_tokens=2000
            )
            
            questions_text = response.choices[0].message.content
            questions_data = json.loads(questions_text)
            
            return [
                {
                    "id": str(uuid.uuid4()),
                    "text": q.get("text", ""),
                    "kind": "main"
                }
                for q in questions_data
            ]
            
        except Exception as e:
            logging.error(f"Error generating questions: {e}")
            return []

    @staticmethod
    def generate_followup(
        original_question: str,
        answer_transcript: str,
        role: str,
        difficulty: str,
        followup_count: int = 1
    ) -> Dict[str, str]:
        """
        Generate a contextual follow-up question based on the answer.
        """
        
        if not client:
            return {
                "question_id": str(uuid.uuid4()),
                "question_text": "Can you elaborate on that?",
                "type": "followup",
                "reasoning": "Follow-up question"
            }
        
        try:
            followup_types = {
                1: "a clarifying question",
                2: "a deeper technical question",
                3: "a scenario-based challenge"
            }
            
            followup_type = followup_types.get(followup_count, "an advanced follow-up question")
            
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are a technical interviewer. Based on the candidate's answer, generate {followup_type} for a {role} position at {difficulty} level.
The follow-up should:
1. Build on their answer
2. Dig deeper into their technical knowledge
3. Be specific and actionable

Respond in JSON format:
{{
  "question": "your follow-up question here",
  "reasoning": "why you're asking this"
}}"""
                    },
                    {
                        "role": "user",
                        "content": f"""Original Question: {original_question}

Candidate's Answer: {answer_transcript}

Generate a follow-up question."""
                    }
                ],
                temperature=0.8,
                max_tokens=500
            )
            
            followup_data = json.loads(response.choices[0].message.content)
            
            return {
                "question_id": str(uuid.uuid4()),
                "question_text": followup_data.get("question", "Can you elaborate on that?"),
                "type": "followup",
                "reasoning": followup_data.get("reasoning", "Follow-up based on your answer")
            }
            
        except Exception as e:
            logging.error(f"Error generating followup: {e}")
            return {
                "question_id": str(uuid.uuid4()),
                "question_text": "Could you provide more details on that?",
                "type": "followup",
                "reasoning": "Follow-up question"
            }

    @staticmethod
    def get_role_descriptions() -> Dict[str, str]:
        """Get descriptions for different roles."""
        return {
            "Frontend Developer": "Build engaging user interfaces and responsive web applications",
            "Backend Developer": "Design scalable APIs and robust server architecture",
            "Data Scientist": "Extract insights from data and build predictive models",
            "DevOps Engineer": "Manage infrastructure and optimize deployment pipelines",
            "Product Manager": "Drive product vision and strategy",
            "Full Stack Developer": "Build complete applications from frontend to backend",
            "Mobile Developer": "Develop iOS/Android applications",
            "QA Engineer": "Ensure software quality through testing and automation"
        }

    @staticmethod
    def get_available_roles() -> List[str]:
        """Get list of available interview roles."""
        return list(QuestionGenerationService.get_role_descriptions().keys())
