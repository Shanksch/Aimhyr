# Python FastAPI Backend for AI Interview Simulator

This is the Python backend service for the AI Interview Simulator. It handles:

- **Question Generation**: Generate main interview questions and context-aware follow-ups
- **Answer Scoring**: Evaluate answers on clarity, relevance, and correctness
- **Feedback Generation**: Provide constructive feedback to candidates
- **Role Management**: Support multiple interview roles and difficulty levels

## Features

✅ FastAPI - Modern, fast async API framework  
✅ OpenAI Integration - Leverage GPT-4 for smart Q&A and scoring  
✅ NLP Analysis - spaCy for linguistic analysis  
✅ CORS Enabled - Seamless frontend integration  
✅ Docker Ready - Easy deployment  
✅ Comprehensive Logging - Track all operations  

## Project Structure

```
python-backend/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration management
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   ├── services/
│   │   ├── scoring.py          # Answer scoring logic
│   │   └── questions.py        # Question generation
│   └── routes/
│       ├── health.py           # Health checks
│       ├── scoring.py          # Scoring endpoints
│       └── questions.py        # Question endpoints
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker image
├── docker-compose.yml          # Docker compose config
└── .env.example               # Environment template
```

## Installation

### Prerequisites

- Python 3.11+
- pip or poetry
- OpenAI API key

### Local Setup

1. **Clone and navigate:**
   ```bash
   cd python-backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

5. **Run server:**
   ```bash
   python -m uvicorn app.main:app --reload
   ```

   Server runs at: `http://localhost:8000`  
   API docs: `http://localhost:8000/docs`

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
docker-compose up --build
```

### Using Docker

```bash
docker build -t ai-interview-api .
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your_key_here \
  -e FRONTEND_URL=http://localhost:3000 \
  ai-interview-api
```

## API Endpoints

### Health Check
- `GET /api/health` - Service health status

### Scoring
- `POST /api/score` - Score a single answer
- `POST /api/score/batch` - Score multiple answers

### Questions
- `POST /api/questions/main` - Get main interview questions
- `POST /api/questions/followup` - Generate follow-up question
- `GET /api/roles` - Get available roles

## API Examples

### Score an Answer

```bash
curl -X POST http://localhost:8000/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "React uses the virtual DOM to efficiently update the UI...",
    "question": "Explain the virtual DOM and how React uses it",
    "role": "Frontend Developer",
    "difficulty": "Medium"
  }'
```

**Response:**
```json
{
  "scores": {
    "clarity": 0.85,
    "relevance": 0.90,
    "correctness": 0.88
  },
  "total": 0.88,
  "feedback": "Excellent explanation of the virtual DOM concept...",
  "strengths": [
    "Clear and well-articulated answer",
    "Well-targeted to the question"
  ],
  "improvements": [
    "Could mention reconciliation algorithm",
    "Consider discussing performance implications"
  ]
}
```

### Get Main Questions

```bash
curl -X POST http://localhost:8000/api/questions/main \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Frontend Developer",
    "difficulty": "Medium"
  }'
```

### Generate Follow-up

```bash
curl -X POST http://localhost:8000/api/questions/followup \
  -H "Content-Type: application/json" \
  -d '{
    "original_question": "Explain the virtual DOM",
    "answer_transcript": "The virtual DOM is...",
    "role": "Frontend Developer",
    "difficulty": "Medium",
    "followup_count": 1
  }'
```

## Configuration

Create a `.env` file in the root:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# FastAPI Configuration
PORT=8000
HOST=0.0.0.0
DEBUG=True

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# NLP Models
SPACY_MODEL=en_core_web_sm
```

## Integrating with Next.js Frontend

In your Next.js API routes, call the Python backend:

```typescript
// app/api/sessions/[id]/answer/route.ts
const scoreResponse = await fetch('http://localhost:8000/api/score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transcript: userAnswer,
    question: currentQuestion,
    role,
    difficulty
  })
})

const scoreData = await scoreResponse.json()
```

## Deployment Options

### Railway.app (Recommended)
1. Connect GitHub repository
2. Add `OPENAI_API_KEY` environment variable
3. Deploy automatically

### Heroku
```bash
heroku login
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_key
git push heroku main
```

### AWS Lambda
Use AWS SAM or Zappa for serverless deployment.

### Azure Functions
Use Azure Functions Python worker.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| OPENAI_API_KEY | ✓ | - | OpenAI API key for GPT-4 |
| PORT | ✗ | 8000 | Server port |
| HOST | ✗ | 0.0.0.0 | Server host |
| DEBUG | ✗ | False | Debug mode |
| FRONTEND_URL | ✗ | http://localhost:3000 | Frontend URL for CORS |
| OPENAI_MODEL | ✗ | gpt-4-turbo-preview | OpenAI model to use |
| SPACY_MODEL | ✗ | en_core_web_sm | spaCy NLP model |

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black app/
```

### Linting
```bash
flake8 app/
```

## Scoring Mechanism

The scoring service evaluates answers on three dimensions:

### 1. **Clarity (0-1)**
- Sentence structure and length
- Vocabulary usage
- Logical flow
- Responsiveness to the question

### 2. **Relevance (0-1)**
- How well the answer addresses the question
- Presence of role-specific keywords
- Focus on key concepts
- On-topic responses

### 3. **Correctness (0-1)**
- Technical accuracy
- Best practices mentioned
- Industry-standard approaches
- LLM-based technical evaluation

**Total Score** = Average of (Clarity + Relevance + Correctness)

## Limitations & Future Enhancements

- [ ] Speech-to-text integration (Whisper API)
- [ ] Video analysis (eye contact, speaking rate)
- [ ] Real-time streaming responses
- [ ] Custom question templates
- [ ] Performance metrics and analytics
- [ ] Multi-language support
- [ ] Advanced caching for performance

## Troubleshooting

### OpenAI API Errors
- Check API key validity
- Ensure sufficient credits
- Monitor rate limits

### NLP Model Issues
- Run: `python -m spacy download en_core_web_sm`
- Ensure 200MB+ disk space

### CORS Issues
- Update `FRONTEND_URL` in `.env`
- Check origins in `app/main.py`

## Support

For issues or questions, please create an issue in the repository.

## License

MIT License - see LICENSE file for details
