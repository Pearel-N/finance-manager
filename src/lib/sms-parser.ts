import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// Used when none of the user's categories fits the SMS.
export const FALLBACK_CATEGORY = "Uncategorized";

// Tried in order. If the first model is busy, the second usually is not:
// a lighter model runs on separate capacity. Both answer this task well,
// since it is short text in, small object out.
const MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"] as const;

// Attempts per model, on top of the first try. Kept low on purpose: when a
// model reports high demand, waiting out four attempts just keeps the phone
// hanging before failing anyway. Better to move on to the next model.
const RETRIES_PER_MODEL = 1;

// The shape we want back from the AI. Every field is filled in, even for
// messages that are not transactions (those get null), so the result is
// always predictable.
//
// The category list is different for every user, so the schema is built per
// call. Using an enum means the AI can only answer with one of the names we
// gave it, never an invented one.
function buildSchema(categoryNames: string[]) {
  const choices = [FALLBACK_CATEGORY, ...categoryNames] as [string, ...string[]];

  return z.object({
    isTransaction: z
      .boolean()
      .describe("true only if money actually moved in or out of the account"),
    type: z
      .enum(["income", "expense"])
      .nullable()
      .describe("credited = income, debited or spent = expense"),
    amount: z.number().nullable().describe("amount in rupees, as a plain number"),
    merchant: z
      .string()
      .nullable()
      .describe(
        "who the money went to or came from, as a readable name (Swiggy, not swiggy@icici), if the SMS says"
      ),
    date: z
      .string()
      .nullable()
      .describe("transaction date as YYYY-MM-DD, if the SMS says"),
    category: z
      .enum(choices)
      .nullable()
      .describe(
        `the best matching category for this transaction, or "${FALLBACK_CATEGORY}" if none fits well`
      ),
  });
}

export type ParsedSms = z.infer<ReturnType<typeof buildSchema>>;

const instructions = `You read SMS messages from Indian banks and card providers.
Decide whether the message reports a real transaction, where money was debited or credited.
These are NOT transactions: OTPs, balance alerts, bill or payment reminders, offers, promotions, and failed or declined payments.
If it is not a transaction, set isTransaction to false and every other field to null.
Never guess a value that is not in the message; use null instead.
For the category, pick from the allowed list only. Use "${FALLBACK_CATEGORY}" rather than forcing a poor match.`;

export async function parseSms(text: string, categoryNames: string[]): Promise<ParsedSms> {
  // Remove duplicates and the fallback name, so the enum has unique values.
  const names = [...new Set(categoryNames)].filter((name) => name !== FALLBACK_CATEGORY);
  const schema = buildSchema(names);

  let lastError: unknown;

  for (const modelId of MODELS) {
    try {
      const { output } = await generateText({
        model: google(modelId),
        system: instructions,
        prompt: text,
        output: Output.object({ schema }),
        maxRetries: RETRIES_PER_MODEL,
      });
      return output;
    } catch (error) {
      lastError = error;
      console.warn(`parseSms: ${modelId} failed, trying the next model`);
    }
  }

  throw lastError;
}
