 # AI Interview Coach — Project Spec (MVP)

**Elevator:** Browser app that generates role-specific interview questions, records answers (audio/video), transcribes answers, scores them on 5 rubrics, and generates a downloadable feedback report.

**MVP features**
- Role selection: Software Engineer, Data Analyst
- Generate 6 questions per session (warm→hard)
- Record audio (web) and optionally video
- STT → transcript displayed
- Text evaluation: Content, STAR, Clarity, Conciseness, Fillers
- Single-session report + PDF export

**Primary user story**
As an interviewee, I can run a 6-question mock interview and receive a concise feedback report so I can improve before real interviews.

**Tech choices (MVP)**
- Frontend: Next.js + MediaRecorder API
- Backend: FastAPI
- STT: Whisper (API or faster-whisper)
- LLM: OpenAI or LLaMA via API (first pass)
- Metrics store: simple Postgres / SQLite
