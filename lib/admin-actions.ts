"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "./admin";

// ─── Interview Questions ──────────────────────────────────────────────────────

export interface QuestionInput {
  question: string;
  answer: string;
  topic: string;
  level: string;
}

export async function createQuestion(input: QuestionInput) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("interview_questions").insert(input);
  if (error) return { error: error.message };
  revalidatePath("/interview");
  revalidatePath("/admin/questions");
  return { success: true };
}

export async function updateQuestion(id: number, input: QuestionInput) {
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
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("interview_questions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/interview");
  revalidatePath("/admin/questions");
  return { success: true };
}

export async function bulkInsertQuestions(rows: QuestionInput[]) {
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
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("news").insert(input);
  if (error) return { error: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { success: true };
}

export async function deleteNewsArticle(id: number) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { success: true };
}

// ─── Emails / Waitlist ────────────────────────────────────────────────────────

export async function deleteNewsletterSubscriber(id: string | number) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/emails");
  return { success: true };
}
