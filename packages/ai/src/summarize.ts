/**
 * AI summarization and action item extraction
 */

import { z } from "zod";
import { chatCompletion, jsonCompletion } from "./openai-client";
import { AIRequestContext, AIResult, Citation } from "./types";

// ============================================================================
// SCHEMAS
// ============================================================================

export const MeetingSummarySchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export type MeetingSummary = z.infer<typeof MeetingSummarySchema>;

export const ActionItemSchema = z.object({
  title: z.string(),
  details: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeRole: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  sourceSegmentIds: z.array(z.number()).optional(),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;

export const ActionItemsResultSchema = z.object({
  actionItems: z.array(ActionItemSchema),
});

export type ActionItemsResult = z.infer<typeof ActionItemsResultSchema>;

// ============================================================================
// PROMPTS
// ============================================================================

const MEETING_SUMMARY_SYSTEM = `You are an expert meeting summarizer for a construction company. 
Your task is to create concise, actionable summaries from meeting transcripts.

Guidelines:
- Focus on decisions, commitments, and action items
- Use clear, professional language
- Highlight any deadlines or critical dates mentioned
- Note any risks or blockers discussed
- Keep summaries under 500 words

Output a JSON object with:
- summary: A 2-3 paragraph executive summary
- keyPoints: Array of 3-5 key discussion points
- decisions: Array of decisions made during the meeting
- nextSteps: Array of agreed next steps`;

const ACTION_ITEMS_SYSTEM = `You are an expert at extracting action items from meeting transcripts.
Your task is to identify all tasks, commitments, and follow-ups mentioned.

Guidelines:
- Include WHO is responsible (by role if name not mentioned)
- Include WHAT needs to be done (specific and actionable)
- Include WHEN it's due (if mentioned or can be inferred)
- Prioritize items with deadlines or dependencies
- Don't create action items for general discussion points

Output a JSON object with:
- actionItems: Array of action items with title, details, dueDate, assigneeRole, priority, sourceSegmentIds`;

// ============================================================================
// FUNCTIONS
// ============================================================================

export interface SummarizeOptions {
  transcript: string;
  segments?: Array<{ id: number; text: string; start: number; end: number }>;
  locale?: string;
  context?: AIRequestContext;
  ragContext?: string;
}

/**
 * Generate a meeting summary from transcript
 */
export async function summarizeMeeting(
  options: SummarizeOptions
): Promise<AIResult<MeetingSummary>> {
  const userPrompt = options.ragContext
    ? `Meeting Transcript:\n${options.transcript}\n\nAdditional Context:\n${options.ragContext}`
    : `Meeting Transcript:\n${options.transcript}`;

  const result = await jsonCompletion<MeetingSummary>({
    model: "gpt-4o",
    temperature: 0.3,
    context: options.context,
    messages: [
      { role: "system", content: MEETING_SUMMARY_SYSTEM },
      { role: "user", content: userPrompt },
    ],
  });

  // Validate with Zod
  const data = MeetingSummarySchema.parse(result.data);

  return {
    data,
    metadata: result.metadata,
  };
}

/**
 * Extract action items from transcript
 */
export async function extractActionItems(
  options: SummarizeOptions
): Promise<AIResult<ActionItemsResult>> {
  const userPrompt = `Meeting Transcript:\n${options.transcript}`;

  const result = await jsonCompletion<ActionItemsResult>({
    model: "gpt-4o",
    temperature: 0.2,
    context: options.context,
    messages: [
      { role: "system", content: ACTION_ITEMS_SYSTEM },
      { role: "user", content: userPrompt },
    ],
  });

  // Validate with Zod
  const data = ActionItemsResultSchema.parse(result.data);

  // Map segment IDs to citations
  const citations: Citation[] = [];
  if (options.segments) {
    for (const item of data.actionItems) {
      if (item.sourceSegmentIds) {
        for (const segId of item.sourceSegmentIds) {
          const segment = options.segments.find((s) => s.id === segId);
          if (segment) {
            citations.push({
              sourceId: String(segment.id),
              sourceType: "transcript",
              snippet: segment.text.substring(0, 200),
              confidence: 0.9,
              location: `${formatTime(segment.start)}-${formatTime(segment.end)}`,
            });
          }
        }
      }
    }
  }

  return {
    data,
    metadata: result.metadata,
    citations: citations.length > 0 ? citations : undefined,
  };
}

/**
 * Generate both summary and action items in one call
 */
export async function summarizeWithActionItems(
  options: SummarizeOptions
): Promise<{
  summary: AIResult<MeetingSummary>;
  actionItems: AIResult<ActionItemsResult>;
}> {
  // Run both in parallel
  const [summary, actionItems] = await Promise.all([
    summarizeMeeting(options),
    extractActionItems(options),
  ]);

  return { summary, actionItems };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ============================================================================
// TASK GENERATION
// ============================================================================

const DAILY_PLAN_SYSTEM = `You are a construction project manager AI assistant.
Your task is to analyze open tasks and generate a prioritized daily plan.

Consider:
- Urgent deadlines take highest priority
- Group tasks by project/location to minimize travel
- Estimate realistic completion times
- Account for dependencies between tasks
- Standard work day is 8 hours

Output a JSON object with:
- tasks: Array of task IDs in priority order
- reasoning: Brief explanation of prioritization logic
- estimatedHours: Total estimated hours for the plan`;

export interface DailyPlanInput {
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate?: string;
    project?: string;
    estimatedHours?: number;
  }>;
  date: string;
  context?: AIRequestContext;
}

export const DailyPlanResultSchema = z.object({
  tasks: z.array(z.string()),
  reasoning: z.string(),
  estimatedHours: z.number(),
});

export type DailyPlanResult = z.infer<typeof DailyPlanResultSchema>;

/**
 * Generate a prioritized daily task plan
 */
export async function generateDailyPlan(
  options: DailyPlanInput
): Promise<AIResult<DailyPlanResult>> {
  const taskList = options.tasks
    .map((t) => `- ${t.id}: ${t.title} [${t.priority}]${t.dueDate ? ` due ${t.dueDate}` : ""}${t.project ? ` (${t.project})` : ""}`)
    .join("\n");

  const userPrompt = `Date: ${options.date}\n\nOpen Tasks:\n${taskList}`;

  const result = await jsonCompletion<DailyPlanResult>({
    model: "gpt-4o-mini",
    temperature: 0.3,
    context: options.context,
    messages: [
      { role: "system", content: DAILY_PLAN_SYSTEM },
      { role: "user", content: userPrompt },
    ],
  });

  const data = DailyPlanResultSchema.parse(result.data);

  return {
    data,
    metadata: result.metadata,
  };
}

