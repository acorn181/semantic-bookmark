import type { BookmarkRule, Settings } from "./settings";

export type PageState = {
  title: string;
  url: string;
  content: string;
};

export type JevChoiceResult = {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

type JevResponse = {
  model?: string;
  answers?: {
    destination?: {
      type?: string;
      choice?: string;
      confidence?: number;
      probabilities?: Record<string, number>;
    };
  };
  usage?: JevChoiceResult["usage"];
};

function buildCriteria(rules: BookmarkRule[]): Record<string, string> {
  return Object.fromEntries(
    rules.map((rule) => [
      rule.id,
      `${rule.label}: ${rule.description}`,
    ]),
  );
}

export async function classifyPage(
  state: PageState,
  settings: Settings,
): Promise<JevChoiceResult> {
  if (!settings.apiKey.trim()) {
    throw new Error("Jev API key is not configured.");
  }

  if (settings.rules.length < 2) {
    throw new Error("Configure at least two bookmark rules.");
  }

  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: settings.model || "jev-latest",
      state,
      questions: {
        destination: {
          type: "choice",
          instructions:
            "Choose the single best destination for this bookmark. Follow the user's category definitions closely. Prefer the catch-all category only when no specific category clearly applies.",
          criteria: buildCriteria(settings.rules),
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Jev API error ${response.status}: ${body || response.statusText}`,
    );
  }

  const data = (await response.json()) as JevResponse;
  const answer = data.answers?.destination;

  if (!answer?.choice || !answer.probabilities) {
    throw new Error("Jev returned an unexpected response.");
  }

  return {
    choice: answer.choice,
    confidence: answer.confidence ?? 0,
    probabilities: answer.probabilities,
    model: data.model,
    usage: data.usage,
  };
}
