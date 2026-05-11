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
GROQ_KEY = "your_groq_key_here"       # get free key at console.groq.com → paste here (do NOT commit)
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


def collect_from_leetcode() -> list:
    """Fetch real interview questions from LeetCode Discuss (public GraphQL API)."""
    collected = []
    headers = {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
    }

    # Search tags that have real ML interview discussions
    tags = [
        "machine-learning", "system-design", "amazon", "google",
        "microsoft", "meta", "apple", "interview-question"
    ]

    for tag in tags:
        try:
            query = {
                "query": """
                query discussionCategoryTopics($categories: [String], $tags: [String], $orderBy: TopicSortingOption, $skip: Int, $query: String) {
                    categoryTopicList(
                        categories: $categories
                        tags: $tags
                        orderBy: $orderBy
                        skip: $skip
                        query: $query
                        first: 15
                    ) {
                        edges {
                            node {
                                id
                                title
                                post { content }
                                tags { name }
                            }
                        }
                    }
                }
                """,
                "variables": {
                    "categories": ["interview-question"],
                    "tags": [tag],
                    "orderBy": "most_votes",
                    "skip": 0,
                    "query": "machine learning AI"
                }
            }
            resp = requests.post(
                "https://leetcode.com/graphql",
                json=query,
                headers=headers,
                timeout=15
            )
            if resp.status_code != 200:
                continue

            data = resp.json()
            edges = data.get("data", {}).get("categoryTopicList", {}).get("edges", [])

            for edge in edges:
                node = edge.get("node", {})
                title   = node.get("title", "")
                content = node.get("post", {}).get("content", "")
                text    = f"{title}\n{content}"
                if len(text) > 80:
                    collected.append({
                        "source": f"LeetCode Discuss (tag: {tag})",
                        "company": None,
                        "text": text[:3000]
                    })

            time.sleep(2)

        except Exception as e:
            print(f"  LeetCode tag '{tag}' failed: {e}")

    print(f"  Collected {len(collected)} LeetCode Discuss posts")
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


PROGRESS_FILE = "progress.json"
BATCH_SIZE    = 8   # items per API call — uses ~5K tokens per batch instead of 2K per item

def load_progress() -> dict:
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"last_index": 0, "questions": []}

def save_progress(index: int, questions: list):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump({"last_index": index, "questions": questions}, f, indent=2, ensure_ascii=False)

def extract_and_rephrase(raw_items: list) -> list:
    """
    Processes items in batches of 8 to save tokens.
    Saves progress after each batch — resumes from where it stopped.
    """
    client  = Groq(api_key=GROQ_KEY)
    progress = load_progress()
    start   = progress["last_index"]
    all_questions = progress["questions"]
    seen    = {q.get("question", "")[:60].lower() for q in all_questions}

    if start > 0:
        print(f"  ▶ Resuming from item {start}/{len(raw_items)} ({len(all_questions)} questions already extracted)")

    # Process in batches of BATCH_SIZE
    for batch_start in range(start, len(raw_items), BATCH_SIZE):
        batch = raw_items[batch_start : batch_start + BATCH_SIZE]
        batch_end = min(batch_start + BATCH_SIZE, len(raw_items))
        print(f"  Batch {batch_start+1}–{batch_end} of {len(raw_items)}...")

        # Combine all items in the batch into one prompt
        combined_text = ""
        for item in batch:
            combined_text += f"\n--- Source: {item['source']} ---\n{item['text'][:600]}\n"

        try:
            prompt = f"""You are an expert AI/ML interview question writer.

Read the texts below (from multiple sources) and extract real AI/ML interview questions.
Then REPHRASE every question completely in your own words — nothing should look copied.
Write a high-quality 4-6 sentence model answer for each question.

TEXTS:
{combined_text}

Return a JSON array. Each item must have:
{{
  "question": "your rephrased version of the question",
  "answer": "detailed 4-6 sentence model answer you wrote",
  "topic": "one of: {', '.join(VALID_TOPICS)}",
  "level": "one of: Junior, Mid, Senior, Lead",
  "company": "company name if mentioned, else null"
}}

Rules:
- Rephrase EVERYTHING — no direct copying
- Only include genuine technical AI/ML questions
- Skip behavioural, vague, or off-topic items
- No duplicates
- Return ONLY valid JSON array, nothing else"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=3000,
            )

            content = response.choices[0].message.content.strip()
            if "```" in content:
                content = content.split("```")[1].lstrip("json").strip()

            questions = json.loads(content)

            for q in questions:
                key = q.get("question", "")[:60].lower()
                if key not in seen and q.get("question") and q.get("answer"):
                    seen.add(key)
                    all_questions.append(q)

            # Save progress after every batch
            save_progress(batch_end, all_questions)
            print(f"    ✓ Got {len(questions)} questions | Total: {len(all_questions)} | Saved progress")
            time.sleep(2)

        except Exception as e:
            err = str(e)
            if "429" in err or "rate_limit" in err.lower():
                # Extract wait time from error message
                import re
                wait_match = re.search(r'try again in (\d+)m', err)
                wait_min = int(wait_match.group(1)) + 1 if wait_match else 30
                save_progress(batch_start, all_questions)
                print(f"\n⏸  Rate limit hit. Progress saved at item {batch_start}.")
                print(f"✅ Already extracted {len(all_questions)} questions → saved to progress.json")
                print(f"\n👉 Wait {wait_min} minutes then run again: python agent.py extract")
                print("   It will resume from where it stopped.")
                break
            else:
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
        print("📡 Collecting from Reddit, LeetCode, GitHub, RSS feeds...")
        raw = []
        raw += collect_from_reddit()
        raw += collect_from_leetcode()
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
        # Check if resuming or starting fresh
        prog = load_progress()
        if prog["last_index"] > 0:
            print(f"▶ Resuming from item {prog['last_index']}/{len(raw)} — {len(prog['questions'])} questions already done")
        else:
            print(f"🤖 Extracting + rephrasing {len(raw)} sources in batches of {BATCH_SIZE}...")
        questions = extract_and_rephrase(raw)
        save_and_print(questions)
        # Clear progress after full completion
        if os.path.exists(PROGRESS_FILE):
            os.remove(PROGRESS_FILE)

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
        raw += collect_from_leetcode()
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
