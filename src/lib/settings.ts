export type BookmarkRule = {
  id: string;
  label: string;
  description: string;
  folderPath: string;
};

export type Settings = {
  apiKey: string;
  model: string;
  maxContentChars: number;
  rules: BookmarkRule[];
};

export const DEFAULT_RULES: BookmarkRule[] = [
  {
    id: "read_later",
    label: "Read Later",
    description:
      "Articles, blog posts, news, essays, videos, or other content whose main value is consuming the content later. Exclude interactive tools, product pages, and documentation used mainly as a reference.",
    folderPath: "Read Later",
  },
  {
    id: "tools_services",
    label: "Tools & Services",
    description:
      "Web apps, online services, software, utilities, or products whose main value is using or trying the thing itself. Exclude articles that merely discuss a tool.",
    folderPath: "Tools & Services",
  },
  {
    id: "reference",
    label: "Reference",
    description:
      "Documentation, manuals, guides, specifications, APIs, how-to material, or other pages kept primarily for repeated lookup while doing something.",
    folderPath: "Reference",
  },
  {
    id: "shopping",
    label: "Shopping & Wishlist",
    description:
      "Product pages, purchase candidates, comparison pages, or services being considered for purchase. Exclude general reviews or articles unless they are being kept mainly to support a buying decision.",
    folderPath: "Shopping & Wishlist",
  },
  {
    id: "other",
    label: "Other",
    description:
      "Anything that does not clearly fit another configured bookmark category.",
    folderPath: "Other",
  },
];

const LEGACY_DEFAULT_IDS = ["ai_try", "ai_article", "dev_reference", "other"];

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  model: "jev-latest",
  maxContentChars: 12000,
  rules: cloneDefaultRules(),
};

const STORAGE_KEY = "semanticBookmarkSettings";

export function cloneDefaultRules(): BookmarkRule[] {
  return DEFAULT_RULES.map((rule) => ({ ...rule }));
}

function looksLikeLegacyDefaults(rules: BookmarkRule[]): boolean {
  if (rules.length !== LEGACY_DEFAULT_IDS.length) return false;
  const ids = rules.map((rule) => rule.id).sort();
  return [...LEGACY_DEFAULT_IDS].sort().every((id, index) => id === ids[index]);
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const raw = (stored[STORAGE_KEY] ?? {}) as Partial<Settings> & {
    setupCompleted?: boolean;
  };

  let rules = Array.isArray(raw.rules) ? raw.rules : cloneDefaultRules();

  // Migrate the first prototype's developer-specific AI taxonomy to
  // general-purpose defaults, while preserving any genuinely customized rules.
  if (looksLikeLegacyDefaults(rules)) {
    rules = cloneDefaultRules();
  }

  return {
    apiKey: raw.apiKey ?? DEFAULT_SETTINGS.apiKey,
    model: raw.model ?? DEFAULT_SETTINGS.model,
    maxContentChars:
      raw.maxContentChars ?? DEFAULT_SETTINGS.maxContentChars,
    rules,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}
