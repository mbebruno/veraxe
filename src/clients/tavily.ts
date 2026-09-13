const TAVILY_BASE = "https://api.tavily.com";

export interface SearchRequest {
  query: string;
  search_depth?: "basic" | "advanced";
  max_results?: number;
  include_answer?: boolean;
  include_images?: boolean;
}

export interface SearchResult {
  query: string;
  answer?: string;
  images?: Array<{ url: string; alt: string }>;
  results: Array<{
    title: string;
    url: string;
    content: string;
  }>;
  response_time: number;
}

export async function search(req: SearchRequest): Promise<SearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY non défini. Lance `veraxe init`.");
  }

  const res = await fetch(`${TAVILY_BASE}/search`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavily API error ${res.status}: ${text}`);
  }

  return res.json();
}
