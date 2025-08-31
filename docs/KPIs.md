# KPIs & Measurement

Primary KPI:
- **Adoption:** ≥80% of first-time users complete one session and get a report.

Quality KPIs:
- **STT WER:** target ≤12% (how to measure: use jiwer on a small test set)
- **LLM latency:** p95 ≤ 3s for question generation/evaluation (measure client->response)
- **Evaluation latency:** end-to-end evaluation after transcript ≤ 3s
- **User CSAT:** average ≥4/5 in a 10-user pilot

Measurement methods:
- WER: record 10 controlled transcripts with ground-truth and compute jiwer WER.
- Latency: log timestamps at request start and end in backend; compute p50/p95.
- CSAT: short survey after session (5 Qs, Likert). 
