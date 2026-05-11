# AmanAI Lab — Upload Agent

Upload interview questions to your site automatically.

## Setup (one time)

```bash
pip install groq requests
```

Get free Groq API key at: https://console.groq.com

Open `agent.py` and update:
- `API_KEY` = your ADMIN_UPLOAD_KEY from Vercel
- `GROQ_KEY` = your Groq API key

## How to use

**Step 1 — Paste text and extract:**
1. Go to Glassdoor / Reddit, copy interview experience text
2. Paste it into `RAW_TEXT` in agent.py
3. Set `COMPANY = "Google"` (or whichever company)
4. Run: `python agent.py`
5. Opens `extracted_questions.json` — check it looks good

**Step 2 — Review:**
1. Open `extracted_questions.json` in Notepad or VS Code
2. Delete questions that are wrong or irrelevant
3. Save as `reviewed_questions.json`

**Step 3 — Upload:**
```bash
python agent.py upload
```

Done. Questions appear on your site at /questions

## Valid topics
LLM, RAG, Agents, Fine-Tuning, MLOps, Transformers, System Design,
Python, Vector DB, Statistics, Behavioral, Computer Vision, NLP, SQL & Data

## Valid levels
Junior, Mid, Senior, Lead
