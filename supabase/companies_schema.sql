-- ============================================================
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  logo_emoji       TEXT NOT NULL DEFAULT '🏢',
  tagline          TEXT,
  description      TEXT,
  hq               TEXT,
  size             TEXT,
  interview_rounds INTEGER DEFAULT 4,
  interview_format TEXT,
  what_they_look_for TEXT[] DEFAULT '{}',
  tips             TEXT[] DEFAULT '{}',
  is_featured      BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. company_questions table
CREATE TABLE IF NOT EXISTS public.company_questions (
  id           SERIAL PRIMARY KEY,
  company_id   INTEGER REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  question     TEXT NOT NULL,
  model_answer TEXT NOT NULL,
  topic        TEXT NOT NULL,
  level        TEXT NOT NULL DEFAULT 'Mid',
  is_verified  BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name  TEXT NOT NULL,
  author_email TEXT,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'experience', -- experience | question | tip
  company_slug TEXT,
  approved     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS company_questions_company_idx ON public.company_questions (company_id);
CREATE INDEX IF NOT EXISTS community_posts_approved_idx ON public.community_posts (approved, created_at DESC);

-- 5. RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Service role full access companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read company questions" ON public.company_questions FOR SELECT USING (true);
CREATE POLICY "Service role full access company questions" ON public.company_questions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read approved posts" ON public.community_posts FOR SELECT USING (approved = true);
CREATE POLICY "Anyone can insert post" ON public.community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access posts" ON public.community_posts FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 6. Seed: 9 companies
-- ============================================================
INSERT INTO public.companies (name, slug, logo_emoji, tagline, description, hq, size, interview_rounds, interview_format, what_they_look_for, tips, is_featured) VALUES
('Google / DeepMind', 'google', '🟦', 'Moonshots in AI', 'Google is famous for rigorous technical interviews covering ML fundamentals, system design, coding, and leadership. DeepMind focuses heavily on research depth.', 'Mountain View, CA', '100,000+', 5, 'Recruiter screen → Phone screen (coding) → Virtual onsites: 2 coding + 1 ML design + 1 system design + 1 Googleyness', ARRAY['Strong ML theory (transformers, backprop, optimization)', 'System design at scale', 'Clear communication', 'Structured problem solving'], ARRAY['Know your ML fundamentals cold — expect theory questions', 'Practice Google-scale system design (Search, Maps, YouTube)', 'Prepare 5 strong STAR stories', 'Study distributed training and serving infrastructure'], true),

('Meta / FAIR', 'meta', '🔵', 'Building the future of connection and AI', 'Meta values practical ML at scale. FAIR focuses on research. Expect coding, ML design, and behavioral rounds with emphasis on impact and ownership.', 'Menlo Park, CA', '50,000+', 4, 'Recruiter screen → Coding screen → Onsites: 2 coding + 1 ML system design + 1 behavioral', ARRAY['Impact-driven mindset', 'Practical ML skills (PyTorch, large-scale training)', 'Ownership and autonomy', 'Fast execution'], ARRAY['Emphasize impact in all answers — Meta loves "moved the metric by X%"', 'Know PyTorch deeply', 'Study recommendation systems and ranking models', 'Read Meta AI research papers before interviews'], true),

('OpenAI', 'openai', '⚫', 'Making AI safe and beneficial', 'OpenAI looks for deep ML researchers and engineers. Interviews are technical and research-heavy. Expect questions on LLMs, RLHF, alignment, and scaling.', 'San Francisco, CA', '1,000+', 5, 'Application review → Technical screen → Research discussion → Full onsites: coding + ML design + research fit', ARRAY['Deep understanding of LLMs and transformers', 'Research mindset', 'Alignment awareness', 'Strong Python and PyTorch'], ARRAY['Read key OpenAI papers before interview (GPT, InstructGPT, RLHF)', 'Understand RLHF and DPO deeply', 'Show research curiosity, not just engineering skills', 'Be prepared to discuss AI safety trade-offs'], true),

('Anthropic', 'anthropic', '🟠', 'AI safety research and products', 'Anthropic is highly selective with a strong focus on AI safety, interpretability, and alignment research. Interviews test both technical depth and alignment thinking.', 'San Francisco, CA', '500+', 5, 'Application → Technical screen → Research paper discussion → Onsites: coding + ML system design + alignment discussion', ARRAY['AI safety awareness', 'Interpretability research interest', 'Constitutional AI knowledge', 'Strong ML fundamentals'], ARRAY['Read Anthropic Constitutional AI paper', 'Understand mechanistic interpretability basics', 'Show genuine interest in AI safety, not just capabilities', 'Expect philosophical questions about AI risk'], true),

('Microsoft', 'microsoft', '🟩', 'AI-first cloud and productivity', 'Microsoft (including Azure AI) focuses on applied ML, cloud-scale systems, and integrating AI into products. Copilot and Azure OpenAI teams are highly active.', 'Redmond, WA', '200,000+', 4, 'Recruiter call → Technical phone screen → 4-5 virtual onsites: coding + design + behavioral', ARRAY['Azure and cloud knowledge', 'Applied ML experience', 'Cross-team collaboration', 'Customer-obsession'], ARRAY['Study Azure AI services', 'Know how to deploy ML models at scale', 'Prepare stories about cross-team collaboration', 'Understand responsible AI principles'], false),

('Amazon', 'amazon', '🟡', 'Earth''s most customer-centric AI company', 'Amazon interviews are famously leadership-principle heavy. Every answer should reference LP''s. ML roles also test algorithms and system design.', 'Seattle, WA', '500,000+', 5, 'Online assessment → Phone screen → Loop: 4-5 rounds each with LP focus + technical depth', ARRAY['Leadership Principles alignment', 'Customer obsession', 'Data-driven decision making', 'Operational excellence'], ARRAY['Memorize all 16 Leadership Principles — every answer must reference one', 'Prepare 2 STAR stories per LP', 'Study recommendation and search ranking systems', 'Know AWS SageMaker and ML infrastructure'], false),

('Apple', 'apple', '⚪', 'AI at the intersection of hardware and software', 'Apple values privacy, on-device ML, and polish. Interviews are technical but also assess design sensibility and attention to detail.', 'Cupertino, CA', '150,000+', 5, 'Recruiter screen → Technical screen → Onsites: coding + ML design + domain expertise + manager fit', ARRAY['On-device ML (Core ML, Neural Engine)', 'Privacy-first thinking', 'Attention to detail', 'Cross-disciplinary collaboration'], ARRAY['Study on-device ML and model compression', 'Know Core ML and Metal Performance Shaders', 'Privacy is Apple''s core value — show you understand it', 'Expect questions on model optimization for edge devices'], false),

('Nvidia', 'nvidia', '🟢', 'Accelerated computing and AI infrastructure', 'Nvidia focuses on GPU architecture, CUDA, and AI infrastructure. Deep knowledge of parallel computing and ML training optimization is essential.', 'Santa Clara, CA', '30,000+', 4, 'Recruiter screen → Technical phone screen → Onsites: coding + systems design + domain depth', ARRAY['CUDA and GPU programming', 'Distributed training expertise', 'Performance optimization mindset', 'Deep learning framework internals'], ARRAY['Study CUDA programming model deeply', 'Know distributed training (NCCL, FSDP, Megatron)', 'Understand GPU memory hierarchy', 'Learn about TensorRT and model optimization'], false),

('Hugging Face', 'hugging-face', '🤗', 'The AI community platform', 'Hugging Face values open-source contributions and community. Strong Python, transformers knowledge, and ideally existing contributions to HF repos.', 'New York, NY (Remote-first)', '500+', 4, 'Application review → Take-home → Technical discussion → Founder/team fit', ARRAY['Open-source mindset', 'Deep transformers knowledge', 'Python and PyTorch expertise', 'Community contribution'], ARRAY['Contribute to HuggingFace repos before applying', 'Know the transformers library inside out', 'Have a strong GitHub profile', 'Show you care about democratizing AI'], false)
ON CONFLICT (slug) DO NOTHING;
