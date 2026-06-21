import { GEMINI_FLASH_MODEL } from "./models";

export type GeminiMessage = {
  role: "user" | "model";
  content: string;
};

export type GeminiResult = {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export class GeminiCallError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiCallError";
    this.status = status;
  }
}

export async function callGeminiFlash(options: {
  apiKey: string;
  systemInstruction?: string;
  userPrompt: string;
  responseJson?: boolean;
  maxOutputTokens?: number;
}): Promise<GeminiResult> {
  const model = GEMINI_FLASH_MODEL.replace("google/", "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(options.apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: options.systemInstruction
        ? { parts: [{ text: options.systemInstruction }] }
        : undefined,
      contents: [{ role: "user", parts: [{ text: options.userPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: options.maxOutputTokens ?? 8192,
        ...(options.responseJson ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new GeminiCallError(bodyText.slice(0, 500) || `Gemini failed (${response.status})`, response.status);
  }

  const parsed = JSON.parse(bodyText) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!content) {
    throw new GeminiCallError("Gemini returned empty content", response.status);
  }

  return {
    content,
    model: GEMINI_FLASH_MODEL,
    usage: parsed.usageMetadata
      ? {
          promptTokens: parsed.usageMetadata.promptTokenCount,
          completionTokens: parsed.usageMetadata.candidatesTokenCount,
          totalTokens: parsed.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}
