import { requireAdmin } from "@/lib/api/auth";
import { handleError, ok } from "@/lib/api/responses";
import { generateTopicRequestSchema } from "@/lib/api/schemas";
import { generateTopicContent, generateTopicSection } from "@/lib/api/ai";

/// Drafts a full topic body, or just one section on retry; the client still reviews and edits before POSTing /api/topics.
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = generateTopicRequestSchema.parse(await request.json());
    const result =
      input.section === "all" ? await generateTopicContent(input) : await generateTopicSection({ ...input, section: input.section });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
