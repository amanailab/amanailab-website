"""
AmanAI Lab — Question Upload Agent
====================================
STEP 1: python agent.py          → extracts questions, saves to extracted_questions.json
STEP 2: open extracted_questions.json, review, delete bad ones, save as reviewed_questions.json
STEP 3: python agent.py upload   → uploads reviewed questions to your site
"""

import os, sys, json, requests
from groq import Groq

# ── CONFIG — update these ─────────────────────────────────────────────────────
SITE_URL = "https://amanailab.com"
API_KEY  = "amanailab2026secret123"    # same as ADMIN_UPLOAD_KEY in Vercel
GROQ_KEY = "your_groq_key_here"        # get free key at console.groq.com
# ─────────────────────────────────────────────────────────────────────────────

# ── PASTE YOUR RAW TEXT HERE ──────────────────────────────────────────────────
# Copy text from Glassdoor, Reddit, or your own notes and paste it below
COMPANY  = "Google"   # change this per batch
RAW_TEXT = """
paste your text here — glassdoor post, reddit thread, anything
"""
# ─────────────────────────────────────────────────────────────────────────────

VALID_TOPICS = ["LLM", "RAG", "Agents", "Fine-Tuning", "MLOps", "Transformers",
                "System Design", "Python", "Vector DB", "Statistics", "Behavioral",
                "Computer Vision", "NLP", "SQL & Data"]
VALID_LEVELS = ["Junior", "Mid", "Senior", "Lead"]


def extract_questions(raw_text: str, company: str = None) -> list:
    """Uses Groq AI to extract and format questions from any raw text."""
    client = Groq(api_key=GROQ_KEY)

    prompt = f"""You are an AI/ML interview question curator.
Extract interview questions from the text below and return as a JSON array.
{'The company is: ' + company if company else ''}

Each question must have these exact fields:
- "question": the interview question (string)
- "answer": a detailed 3-5 sentence model answer — write a good one even if not in the text
- "topic": MUST be one of: {', '.join(VALID_TOPICS)}
- "level": MUST be one of: Junior, Mid, Senior, Lead
- "company": company name string or null
- "source": e.g. "Glassdoor 2024" or null

Rules:
- Only include genuine AI/ML technical questions
- Skip vague or behavioural-only questions unless very relevant
- Make sure answers are accurate and educational
- Do not include duplicate questions

TEXT:
{raw_text}

Return ONLY a valid JSON array. No markdown, no explanation, no extra text."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=4000,
    )

    content = response.choices[0].message.content.strip()

    # Remove markdown code blocks if present
    if "```" in content:
        parts = content.split("```")
        content = parts[1] if len(parts) > 1 else parts[0]
        if content.startswith("json"):
            content = content[4:].strip()

    return json.loads(content)


def upload_questions(filename: str = "reviewed_questions.json") -> dict:
    """Uploads the reviewed questions file to your site."""
    if not os.path.exists(filename):
        print(f"❌ File not found: {filename}")
        print("   Run 'python agent.py' first, review, then save as reviewed_questions.json")
        sys.exit(1)

    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Uploading {len(data)} questions to {SITE_URL}...")

    response = requests.post(
        f"{SITE_URL}/api/admin/bulk-upload",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={"type": "questions", "data": data},
        timeout=30,
    )

    return response.json()


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":

    if len(sys.argv) > 1 and sys.argv[1] == "upload":
        # ── STEP 3: Upload after review ──────────────────────────────────────
        result = upload_questions("reviewed_questions.json")
        if result.get("success"):
            print(f"✅ Uploaded {result['inserted']} questions successfully!")
            if result.get("errors"):
                print(f"⚠️  Skipped {result['skipped']}: {result['errors'][:3]}")
        else:
            print(f"❌ Error: {result}")

    else:
        # ── STEP 1: Extract and save for review ──────────────────────────────
        if RAW_TEXT.strip() == "paste your text here — glassdoor post, reddit thread, anything":
            print("❌ Please paste your text into RAW_TEXT in the script first!")
            sys.exit(1)

        print(f"Extracting questions from text (company: {COMPANY or 'unknown'})...")

        try:
            questions = extract_questions(RAW_TEXT, company=COMPANY)
        except json.JSONDecodeError as e:
            print(f"❌ AI returned invalid JSON: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)

        # Save for review
        with open("extracted_questions.json", "w", encoding="utf-8") as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Extracted {len(questions)} questions")
        print("📄 Saved to: extracted_questions.json")
        print("\nPreview of first question:")
        print(json.dumps(questions[0], indent=2) if questions else "None")
        print("\n" + "="*50)
        print("👉 NEXT STEPS:")
        print("   1. Open extracted_questions.json in VS Code or Notepad")
        print("   2. Read each question — delete any that are wrong/irrelevant")
        print("   3. Save the file as: reviewed_questions.json")
        print("   4. Run: python agent.py upload")
