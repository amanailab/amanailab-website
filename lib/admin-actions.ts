"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getAdminSupabase } from "./admin";
import { verifyAdminSession } from "./auth-tokens";

async function requireAdmin() {
  const store = await cookies()
  if (!(await verifyAdminSession(store.get('admin_session')?.value))) throw new Error('Unauthorized')
}

// ─── Interview Questions ──────────────────────────────────────────────────────

export interface QuestionInput {
  question: string;
  answer: string;
  topic: string;
  level: string;
}

export async function createQuestion(input: QuestionInput) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("interview_questions").insert(input);
  if (error) return { error: error.message };
  revalidatePath("/interview");
  revalidatePath("/admin/questions");
  return { success: true };
}

export async function updateQuestion(id: number, input: QuestionInput) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("interview_questions")
    .update(input)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/interview");
  revalidatePath("/admin/questions");
  return { success: true };
}

export async function deleteQuestion(id: number) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("interview_questions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/interview");
  revalidatePath("/admin/questions");
  return { success: true };
}

export async function bulkInsertQuestions(rows: QuestionInput[]) {
  await requireAdmin()
  if (rows.length === 0) return { error: "No rows to insert." };
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("interview_questions").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/interview");
  revalidatePath("/admin/questions");
  return { success: true, count: rows.length };
}

// ─── Resources ────────────────────────────────────────────────────────────────

export interface ResourceInput {
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  is_free?: boolean;
}

export async function createResource(input: ResourceInput) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("resources").insert({
    ...input,
    is_free: input.is_free ?? true,
  });
  if (error) return { error: error.message };
  revalidatePath("/resources");
  revalidatePath("/admin/resources");
  return { success: true };
}

export async function deleteResource(id: string, filePath?: string | null) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  if (filePath) {
    await supabase.storage.from("pdfs").remove([filePath]);
  }
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/resources");
  revalidatePath("/admin/resources");
  return { success: true };
}

// ─── News ─────────────────────────────────────────────────────────────────────

export interface NewsInput {
  title: string;
  source: string;
  source_url: string;
  summary: string;
  developer_take: string;
  impact_score: "game_changer" | "important" | "good_to_know";
  category: "models" | "research" | "tools" | "agents" | "india_ai" | "general";
  published_at: string;
}

export async function createNewsArticle(input: NewsInput) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("news").insert(input);
  if (error) return { error: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { success: true };
}

export async function updateNewsArticle(id: number, input: Partial<NewsInput>) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("news").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { success: true };
}

export async function deleteNewsArticle(id: number) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { success: true };
}

// ─── Emails / Waitlist ────────────────────────────────────────────────────────

export async function deleteNewsletterSubscriber(id: string | number) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/emails");
  return { success: true };
}

// ─── Companies ────────────────────────────────────────────────────────────────

export interface CompanyInput {
  name: string;
  slug: string;
  logo_emoji: string;
  tagline: string;
  description: string;
  hq: string;
  size: string;
  interview_rounds: number;
  interview_format: string;
  what_they_look_for: string[];
  tips: string[];
  is_featured: boolean;
}

export async function createCompany(input: CompanyInput) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("companies").insert(input);
  if (error) return { error: error.message };
  revalidatePath("/companies");
  revalidatePath("/admin/companies");
  return { success: true };
}

export async function updateCompany(id: number, input: Partial<CompanyInput>) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("companies").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/companies");
  revalidatePath("/admin/companies");
  return { success: true };
}

export async function deleteCompany(id: number) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/companies");
  revalidatePath("/admin/companies");
  return { success: true };
}

// ─── Company Questions ────────────────────────────────────────────────────────

export interface CompanyQuestionInput {
  company_id: number;
  question: string;
  model_answer: string;
  topic: string;
  level: string;
}

export async function createCompanyQuestion(input: CompanyQuestionInput) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("company_questions").insert(input);
  if (error) return { error: error.message };
  revalidatePath("/questions");
  revalidatePath("/admin/company-questions");
  return { success: true };
}

export async function updateCompanyQuestion(id: number, input: Partial<CompanyQuestionInput>) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("company_questions").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/questions");
  revalidatePath("/admin/company-questions");
  return { success: true };
}

export async function deleteCompanyQuestion(id: number) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("company_questions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/questions");
  revalidatePath("/admin/company-questions");
  return { success: true };
}

export async function bulkInsertCompanyQuestions(rows: CompanyQuestionInput[]) {
  await requireAdmin()
  if (rows.length === 0) return { error: "No rows to insert." };
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("company_questions").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/questions");
  revalidatePath("/admin/company-questions");
  return { success: true, count: rows.length };
}

// ─── Community ────────────────────────────────────────────────────────────────

export async function approveCommunityPost(id: string) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("community_posts").update({ approved: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/community");
  revalidatePath("/admin/community");
  return { success: true };
}

export async function deleteCommunityPost(id: string) {
  await requireAdmin()
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("community_posts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/community");
  revalidatePath("/admin/community");
  return { success: true };
}
