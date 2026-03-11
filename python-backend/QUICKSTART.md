# FastAPI Python Backend - Integration Summary

## ✅ What's Included

Your FastAPI Python backend is fully configured with:

### **Core Modules**
- ✅ **Scoring Service** (`app/services/scoring.py`)
  - Clarity analysis (sentence structure, vocabulary, flow)
  - Relevance scoring (question alignment, role keywords)
  - Correctness evaluation (best practices, LLM-based)
  - Feedback generation
  - Strengths and improvement areas

- ✅ **Question Generation** (`app/services/questions.py`)
  - Main questions for 8 roles (Easy/Medium/Hard)
  - Follow-up question generation based on answers
  - LLM-powered contextual questions
  - Role descriptions and role list

### **API Routes**
- ✅ `GET /api/health` - Health check
- ✅ `POST /api/score` - Score single answer
- ✅ `POST /api/score/batch` - Score multiple answers
- ✅ `POST /api/questions/main` - Get main questions
- ✅ `POST /api/questions/followup` - Generate follow-up
- ✅ `GET /api/roles` - List available roles

### **Infrastructure**
- ✅ FastAPI application with CORS support
- ✅ Pydantic models for request/response validation
- ✅ Environment configuration management
- ✅ Comprehensive logging
- ✅ Docker & Docker Compose setup
- ✅ Setup scripts for Windows and Unix

## 🚀 Quick Start

### 1. Setup on Windows

```powershell
cd python-backend
.\setup.bat
```

### 2. Setup on macOS/Linux

```bash
cd python-backend
bash setup.sh
```

### 3. Configure OpenAI API

Edit `.env` file:
```env
OPENAI_API_KEY=sk-your-api-key-here
FRONTEND_URL=http://localhost:3000
```

### 4. Run the Server

```bash
python -m uvicorn app.main:app --reload
```

Server: `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

### 5. Test the API

```bash
python test_api.py
```

## 📊 Scoring Breakdown

### Clarity (0-1)
- Sentence structure and length optimization
- Vocabulary diversity and appropriateness
- Logical flow and coherence
- Answer completeness

**Scoring:**
- Too short (<20 words): 0.2-0.4
- Optimal (100-300 words): 0.7-0.95
- Very concise but clear: 0.7-0.85

### Relevance (0-1)
- Question alignment check
- Role-specific keyword detection
- Topic focus evaluation
- Direct question addressing

**Role Keywords:**
- Frontend: React, JavaScript, UI, CSS, HTML, component, state, props
- Backend: API, database, SQL, server, scalability, performance
- Data Science: data, model, analysis, statistics, machine learning
- DevOps: deployment, CI/CD, Docker, Kubernetes, infrastructure
- Product: user, feature, roadmap, metrics, stakeholder

### Correctness (0-1)
- Technical accuracy verification (LLM-based)
- Best practices validation
- Industry-standard compliance
- Common mistakes detection

**Scoring Factors:**
- +0.08 for each best practice mentioned
- Fallback heuristic: 0.5 base + practices bonus
- LLM evaluation when enabled

## 🔌 Integration with Next.js

### Step 1: Add Environment Variable

In `.env.local`:
```env
PYTHON_API_URL=http://localhost:8000
```

### Step 2: Update Next.js API Route

Modify `/app/api/sessions/[id]/answer/route.ts`:

```typescript
import { type NextRequest, NextResponse } from "next/server"

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const form = await req.formData()
    const transcript = String(form.get("transcript") ?? "")
    const question = String(form.get("question") ?? "")
    
    // Call Python API for scoring
    const response = await fetch(`${PYTHON_API_URL}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        question,
        role: String(form.get("role")),
        difficulty: String(form.get("difficulty"))
      })
    })

    if (!response.ok) throw new Error("Scoring failed")
    
    const scores = await response.json()
    
    // Use scores in your response
    return NextResponse.json({
      scores,
      transcript: { text: transcript }
    })
  } catch (err) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
```

### Step 3: Deploy Python Backend

**Option A: Docker Compose (Local)**
```bash
docker-compose up --build
```

**Option B: Railway.app (Recommended)**
1. Push code to GitHub
2. Connect repository to Railway
3. Add `OPENAI_API_KEY` environment variable
4. Deploy

**Option C: Heroku**
```bash
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_key
git push heroku main
```

## 📁 Project Structure

```
python-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app
│   ├── config.py                  # Configuration
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── scoring.py             # Scoring logic
│   │   └── questions.py           # Question generation
│   └── routes/
│       ├── __init__.py
│       ├── health.py              # Health endpoints
│       ├── scoring.py             # Scoring endpoints
│       └── questions.py           # Question endpoints
├── requirements.txt               # Dependencies
├── Dockerfile                     # Docker image
├── docker-compose.yml             # Docker compose
├── .env.example                   # Env template
├── .gitignore                     # Git ignore
├── README.md                      # Full docs
├── INTEGRATION_GUIDE.md           # Integration examples
├── test_api.py                    # API test script
├── setup.sh                       # Unix setup
└── setup.bat                      # Windows setup
```

## 🎯 Available Roles

1. **Frontend Developer** - React, Vue, Angular expertise
2. **Backend Developer** - APIs, databases, scalability
3. **Data Scientist** - ML, statistics, data analysis
4. **DevOps Engineer** - Deployment, infrastructure
5. **Product Manager** - Strategy, metrics, user focus
6. **Full Stack Developer** - Both frontend & backend
7. **Mobile Developer** - iOS/Android development
8. **QA Engineer** - Testing, automation, quality

## 📋 API Response Examples

### Scoring Response
```json
{
  "scores": {
    "clarity": 0.85,
    "relevance": 0.90,
    "correctness": 0.88
  },
  "total": 0.88,
  "feedback": "Excellent explanation with clear examples...",
  "strengths": [
    "Clear and well-articulated answer",
    "Well-targeted to the question",
    "Technically sound"
  ],
  "improvements": [
    "Could mention reconciliation algorithm",
    "Consider discussing performance implications",
    "Add example of hook usage"
  ]
}
```

### Questions Response
```json
{
  "questions": [
    {
      "id": "uuid-1",
      "text": "Explain React hooks and their benefits",
      "kind": "main"
    },
    {
      "id": "uuid-2",
      "text": "How do you manage state in a large application?",
      "kind": "main"
    }
  ],
  "total_count": 6
}
```

### Followup Response
```json
{
  "question_id": "uuid-followup",
  "question_text": "Can you explain how you would handle side effects?",
  "type": "followup",
  "reasoning": "Building on your state management answer"
}
```

## 🔐 Security Considerations

1. **OpenAI API Key**: Never commit `.env` file
2. **CORS**: Configure `FRONTEND_URL` appropriately
3. **Rate Limiting**: Implement in production
4. **Input Validation**: Pydantic handles this
5. **Error Handling**: No sensitive data in responses

## 🚨 Common Issues & Solutions

### Issue: "OpenAI API key not found"
**Solution:** Ensure `.env` file exists and has `OPENAI_API_KEY`

### Issue: "Connection refused" 
**Solution:** Make sure Python backend is running on port 8000

### Issue: "spaCy model not found"
**Solution:** Run `python -m spacy download en_core_web_sm`

### Issue: CORS errors
**Solution:** Add frontend URL to `.env` `FRONTEND_URL` variable

## 📚 Next Steps

1. ✅ Set up the Python backend
2. ✅ Configure OpenAI API key
3. ✅ Test with `python test_api.py`
4. ✅ Integrate with Next.js frontend
5. ✅ Deploy to production (Railway/Heroku/Docker)
6. 🔄 Monitor API usage and costs
7. 🎯 Iterate on scoring algorithms

## 💡 Enhancement Ideas

- [ ] Speech-to-text integration (OpenAI Whisper)
- [ ] Video analysis (eye contact, speaking rate)
- [ ] Real-time streaming responses
- [ ] Custom question templates
- [ ] Performance analytics dashboard
- [ ] Multi-language support
- [ ] Caching for frequently asked questions
- [ ] A/B testing framework
- [ ] Feedback history tracking
- [ ] Difficulty calibration

## 📞 Support

Need help? Check:
- 📖 README.md - Full documentation
- 🔗 INTEGRATION_GUIDE.md - Integration examples
- 🧪 test_api.py - API test examples
- 📚 FastAPI Docs: http://localhost:8000/docs

---

**Your Python backend is ready! 🎉**

Start with: `python -m uvicorn app.main:app --reload`
