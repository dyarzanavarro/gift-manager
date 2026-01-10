import OpenAI from "openai"
import { z } from "zod"
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server"
import { mockOccasions } from "~/data/mockOccasions"

const BodySchema = z.object({
    personId: z.string().uuid(),
    occasionId: z.coerce.number().int(),
    hint: z.string().optional()
})

type Suggestion = {
    title: string
    reason: string
    category: string
    priceHint: string
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { personId, occasionId, hint } = BodySchema.parse(body)

    const client = await serverSupabaseClient(event)
    const user = await serverSupabaseUser(event)
    if (!user) throw createError({ statusCode: 401, statusMessage: "Not authenticated" })

    const { data: person, error: pErr } = await client
        .from("people")
        .select("id, name, birthday, notes")
        .eq("id", personId)
        .single()

    if (pErr || !person) throw createError({ statusCode: 404, statusMessage: "Person not found" })

    const occasion = mockOccasions.find(o => o.id === occasionId)
    if (!occasion) throw createError({ statusCode: 404, statusMessage: "Occasion not found" })

    const { data: existing } = await client
        .from("gifts")
        .select("title, status")
        .eq("person_id", personId)
        .order("created_at", { ascending: false })
        .limit(20)

    const config = useRuntimeConfig()
    const apiKey =
        (config as any).openaiApiKey ||
        process.env.OPENAI_API_KEY

    if (!apiKey) throw createError({ statusCode: 500, statusMessage: "Missing OPENAI_API_KEY" })

    const openai = new OpenAI({ apiKey, timeout: 25000 })

    const prompt = `
Erstelle exakt 3 Geschenkideen für diese Person und diesen Anlass.
Die Vorschläge müssen realistisch und speicherbar sein (nur Titel + kurzer Grund).
Vermeide Duplikate zu bestehenden Ideen.

Person:
- Name: ${person.name}
- Geburtstag: ${person.birthday ?? "unbekannt"}
- Notizen: ${person.notes ?? "keine"}

Anlass:
- ${occasion.name}

Bestehende Ideen:
${(existing ?? []).map(g => `- ${g.title}`).join("\n") || "- keine"}

Hinweis:
${hint ?? "kein"}

Antworte als JSON im Format:
{
  "suggestions":[
    {"title":"...", "reason":"...", "category":"...", "priceHint":"..."},
    ...
  ]
}
`.trim()

    const responseSchema = {
        type: "object",
        properties: {
            suggestions: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        reason: { type: "string" },
                        category: { type: "string" },
                        priceHint: { type: "string" }
                    },
                    required: ["title", "reason", "category", "priceHint"],
                    additionalProperties: false
                }
            }
        },
        required: ["suggestions"],
        additionalProperties: false
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)
    let resp
    try {
        resp = await openai.responses.create(
            {
                model: "gpt-5-nano",
                input: prompt,
                max_output_tokens: 1400,
                reasoning: { effort: "minimal" },
                text: {
                    format: {
                        type: "json_schema",
                        name: "gift_suggestions",
                        schema: responseSchema,
                        strict: true
                    },
                    verbosity: "low"
                }
            },
            { signal: controller.signal }
        )
    } catch (err: any) {
        if (err?.name === "AbortError" || err?.message === "Request was aborted.") {
            throw createError({ statusCode: 504, statusMessage: "AI request timed out" })
        }
        throw err
    } finally {
        clearTimeout(timeoutId)
    }

    const text =
        ((resp as any).output_text ||
            (resp as any)?.output?.[0]?.content?.[0]?.text ||
            "").trim()

    if (!text) {
        console.error("OpenAI empty response", {
            id: (resp as any)?.id,
            error: (resp as any)?.error,
            incomplete: (resp as any)?.incomplete_details
        })
        throw createError({ statusCode: 500, statusMessage: "Empty AI response" })
    }

    let json: unknown
    try {
        json = JSON.parse(text)
    } catch {

        throw createError({ statusCode: 500, statusMessage: "AI response not valid JSON" })
    }

    const Parsed = z.object({
        suggestions: z.array(z.object({
            title: z.string().min(2),
            reason: z.string().min(2),
            category: z.string().min(2),
            priceHint: z.string().min(2)
        })).length(3)
    })

    const parsed = Parsed.parse(json)
    return parsed as { suggestions: Suggestion[] }
})
