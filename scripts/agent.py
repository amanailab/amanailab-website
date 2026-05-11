"""
AmanAI Lab — Multi-Source Question Agent
==========================================
Collects AI/ML interview questions from multiple public sources,
rephrases them so they are original, then uploads to your site.

USAGE:
  python agent.py collect    → scrapes Reddit + RSS feeds, saves raw data
  python agent.py extract    → uses AI to extract + rephrase questions from raw data
  python agent.py upload     → uploads reviewed_questions.json to your site
  python agent.py all        → runs all 3 steps automatically

MANUAL MODE (paste your own text):
  python agent.py manual     → processes RAW_TEXT below
"""

import os, sys, json, time, requests
from groq import Groq
from datetime import datetime

# ── CONFIG ─────────────────────────────────────────────────────────────────────
SITE_URL = "https://amanailab.com"
API_KEY  = "amanailab2026secret123"   # ADMIN_UPLOAD_KEY in Vercel
GROQ_KEY = "your_groq_key_here"       # console.groq.com (free)
# ──────────────────────────────────────────────────────────────────────────────

VALID_TOPICS = [
    "LLM", "RAG", "Agents", "Fine-Tuning", "MLOps", "Transformers",
    "System Design", "Python", "Vector DB", "Statistics", "Behavioral",
    "Computer Vision", "NLP", "SQL & Data"
]

# ── COMPANIES TO SEARCH FOR ────────────────────────────────────────────────────
COMPANIES = [
    "Google", "Meta", "OpenAI", "Microsoft", "Amazon",
    "Anthropic", "Apple", "Netflix", "Uber", "LinkedIn",
    "Nvidia", "Hugging Face", "DeepMind"
]

# ── TOPICS TO SEARCH FOR ──────────────────────────────────────────────────────
SEARCH_TOPICS = [
    "LLM interview questions", "RAG interview questions",
    "machine learning engineer interview", "AI engineer interview questions",
    "transformer model interview", "MLOps interview", "fine tuning LLM interview",
    "vector database interview", "AI system design interview"
]

# ── MANUAL MODE: paste your own text here ─────────────────────────────────────
MANUAL_COMPANY = "Google"
RAW_TEXT = """
paste your text here
"""
# ─────────────────────────────────────────────────────────────────────────────


def collect_from_reddit() -> list:
    """Fetch posts from AI/ML subreddits using Reddit's public JSON API (no auth needed)."""
    collected = []
    subreddits = [
        "MachineLearning", "learnmachinelearning", "cscareerquestions",
        "artificial", "LocalLLaMA", "mlengineering"
    ]

    headers = {"User-Agent": "AmanAILab-QuestionBot/1.0"}

    for sub in subreddits:
        try:
            # Search for interview-related posts
            for query in ["interview questions ML", "ML interview experience", "AI engineer interview"]:
                url = f"https://www.reddit.com/r/{sub}/search.json?q={requests.utils.quote(query)}&restrict_sr=1&sort=relevance&limit=10&t=year"
                resp = requests.get(url, headers=headers, timeout=10)
                if resp.status_code != 200:
                    continue
                data = resp.json()
                posts = data.get("data", {}).get("children", [])
                for post in posts:
                    p = post.get("data", {})
                    text = f"{p.get('title', '')} {p.get('selftext', '')}"
                    if len(text) > 100:
                        collected.append({
                            "source": f"Reddit r/{sub}",
                            "company": None,
                            "text": text[:3000]
                        })
                time.sleep(1)  # be respectful to Reddit API
        except Exception as e:
            print(f"  Reddit r/{sub} failed: {e}")

    print(f"  Collected {len(collected)} Reddit posts")
    return collected


def collect_from_github() -> list:
    """Fetch from public GitHub repos with ML interview questions."""
    collected = []
    # These are public repos with free-to-use interview questions
    repos = [
        "https://raw.githubusercontent.com/khangich/machine-learning-interview/master/README.md",
        "https://raw.githubusercontent.com/andrewekhalel/MLQuestions/master/README.md",
    ]
    for url in repos:
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                collected.append({
                    "source": "GitHub ML Interview Repo",
                    "company": None,
                    "text": resp.text[:5000]
                })
                print(f"  Collected from GitHub: {url.split('/')[4]}/{url.split('/')[5]}")
        except Exception as e:
            print(f"  GitHub {url} failed: {e}")
    return collected


def collect_from_rss() -> list:
    """Fetch AI news and articles from free RSS feeds."""
    collected = []
    feeds = [
        ("https://huggingface.co/blog/feed.xml", "Hugging Face Blog"),
        ("https://openai.com/news/rss.xml", "OpenAI Blog"),
        ("https://feeds.feedburner.com/blogspot/gJZg", "Google AI Blog"),
    ]
    for feed_url, source in feeds:
        try:
            resp = requests.get(feed_url, timeout=10)
            if resp.status_code == 200:
                # Simple XML text extraction (no library needed)
                text = resp.text
                # Extract titles and descriptions
                import re
                titles = re.findall(r'<title>(.*?)</title>', text)
                descs  = re.findall(r'<description>(.*?)</description>', text, re.DOTALL)
                content = " | ".join(titles[:20] + descs[:10])
                if content:
                    collected.append({
                        "source": source,
                        "company": None,
                        "text": content[:4000]
                    })
                    print(f"  Collected from {source}")
        except Exception as e:
            print(f"  RSS {source} failed: {e}")
    return collected


def extract_and_rephrase(raw_items: list) -> list:
    """
    Uses Groq AI to:
    1. Extract questions from raw text
    2. Rephrase them so they are 100% original
    3. Write quality model answers
    """
    client = Groq(api_key=GROQ_KEY)
    all_questions = []
    seen = set()  # avoid duplicates

    for i, item in enumerate(raw_items):
        print(f"  Processing item {i+1}/{len(raw_items)}: {item['source']}")
        try:
            prompt = f"""You are an expert AI/ML interview question writer for AmanAI Lab.

Your job:
1. Read the text below
2. Extract any AI/ML interview questions or topics mentioned
3. REPHRASE each question completely in your own words — it must NOT look copied
4. Write a high-quality 4-6 sentence model answer for each
5. Only include genuine technical AI/ML questions

Source: {item['source']}
Company hint: {item.get('company') or 'various companies'}

Text:
{item['text'][:3000]}

Return a JSON array. Each item:
{{
  "question": "rephrased question in your own words",
  "answer": "detailed 4-6 sentence model answer",
  "topic": "one of: {', '.join(VALID_TOPICS)}",
  "level": "one of: Junior, Mid, Senior, Lead",
  "company": "company name or null"
}}

Rules:
- REPHRASE everything — no direct copying
- Only keep questions that are genuinely useful for AI/ML interview prep
- Skip vague, irrelevant, or duplicate questions
- Minimum 3, maximum 15 questions per batch
- Return ONLY valid JSON array, nothing else"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=4000,
            )

            content = response.choices[0].message.content.strip()
            if "```" in content:
                content = content.split("```")[1].lstrip("json").strip()

            questions = json.loads(content)

            # Deduplicate by question similarity
            for q in questions:
                key = q.get("question", "")[:60].lower()
                if key not in seen:
                    seen.add(key)
                    q["source"] = item["source"]
                    all_questions.append(q)

            time.sleep(1)  # rate limit

        except Exception as e:
            print(f"    Failed: {e}")
            continue

    return all_questions


def upload_questions(filename: str = "reviewed_questions.json") -> dict:
    """Upload the reviewed file to your site."""
    if not os.path.exists(filename):
        print(f"❌ File not found: {filename}")
        sys.exit(1)

    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Uploading {len(data)} questions to {SITE_URL}...")
    response = requests.post(
        f"{SITE_URL}/api/admin/bulk-upload",
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json={"type": "questions", "data": data},
        timeout=30,
    )
    return response.json()


def save_and_print(questions: list):
    """Save extracted questions and show instructions."""
    with open("extracted_questions.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Extracted {len(questions)} unique questions")
    print("📄 Saved to: extracted_questions.json")
    if questions:
        print("\nPreview of first question:")
        print(json.dumps(questions[0], indent=2))
    print("\n" + "="*55)
    print("👉 NEXT STEPS:")
    print("   1. Open extracted_questions.json in VS Code")
    print("   2. Delete any questions that look wrong or irrelevant")
    print("   3. Save as: reviewed_questions.json")
    print("   4. Run: python agent.py upload")


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"

    if cmd == "collect":
        print("📡 Collecting from Reddit, GitHub, RSS feeds...")
        raw = []
        raw += collect_from_reddit()
        raw += collect_from_github()
        raw += collect_from_rss()
        with open("raw_collected.json", "w", encoding="utf-8") as f:
            json.dump(raw, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Collected {len(raw)} raw items → saved to raw_collected.json")
        print("👉 Run: python agent.py extract")

    elif cmd == "extract":
        if not os.path.exists("raw_collected.json"):
            print("❌ Run 'python agent.py collect' first")
            sys.exit(1)
        with open("raw_collected.json", encoding="utf-8") as f:
            raw = json.load(f)
        print(f"🤖 Extracting + rephrasing questions from {len(raw)} sources...")
        questions = extract_and_rephrase(raw)
        save_and_print(questions)

    elif cmd == "manual":
        if "paste your text here" in RAW_TEXT:
            print("❌ Please update RAW_TEXT in the script first")
            sys.exit(1)
        print(f"🤖 Processing your text (company: {MANUAL_COMPANY})...")
        raw = [{"source": "Manual input", "company": MANUAL_COMPANY, "text": RAW_TEXT}]
        questions = extract_and_rephrase(raw)
        save_and_print(questions)

    elif cmd == "upload":
        result = upload_questions("reviewed_questions.json")
        if result.get("success"):
            print(f"✅ Uploaded {result['inserted']} questions successfully!")
        else:
            print(f"❌ Error: {result}")

    elif cmd == "all":
        print("📡 Step 1: Collecting from all sources...")
        raw = []
        raw += collect_from_reddit()
        raw += collect_from_github()
        raw += collect_from_rss()

        print(f"\n🤖 Step 2: Extracting + rephrasing {len(raw)} sources...")
        questions = extract_and_rephrase(raw)

        with open("extracted_questions.json", "w", encoding="utf-8") as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Done! {len(questions)} questions saved to extracted_questions.json")
        print("👉 Review the file, save as reviewed_questions.json, then run:")
        print("   python agent.py upload")

    else:
        print("""
AmanAI Lab Question Agent — Commands:

  python agent.py collect   → fetch from Reddit, GitHub, RSS feeds
  python agent.py extract   → extract + rephrase questions using AI
  python agent.py upload    → upload reviewed_questions.json to site
  python agent.py all       → run collect + extract in one go

  python agent.py manual    → process your own pasted text (edit RAW_TEXT first)

Recommended flow:
  1. python agent.py all
  2. Review extracted_questions.json
  3. Save as reviewed_questions.json
  4. python agent.py upload
""")
