const GROQ_BASE = "https://api.groq.com/openai/v1";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

/** Modèles Groq disponibles ( Llama 3.1, Mixtral, Gemma… ) */
export const MODELS = [
  "llama-3.1-8b-instant",   // rapide, bon pour génération de contenu
  "llama-3.1-70b-versatile", // plus puissant
  "mixtral-8x7b-3276b",
  "gemma-7b-it",
] as const;

export function getDefaultModel(): string {
  return MODELS[0];
}

export async function chat(req: ChatRequest): Promise<{ choices: Array<{ message: { content: string } }>; usage: { total_tokens: number } }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY non défini. Lance `veraxe init` pour configurer.");
  }

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  model = getDefaultModel(),
  temperature = 0.7,
): Promise<string> {
  const res = await chat({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: 4096,
  });

  return res.choices[0]?.message?.content ?? "";
}
