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
  setupCompleted: boolean;
};

export const STARTER_RULES: BookmarkRule[] = [
  {
    id: "ai_try",
    label: "AI / Try",
    description:
      "An AI product, service, library, SDK, or tool I would realistically want to try myself. Exclude news, commentary, and general introductions unless the page is primarily the product itself.",
    folderPath: "AI/Try",
  },
  {
    id: "ai_article",
    label: "AI / Articles",
    description:
      "An article, announcement, news item, opinion, tutorial, or commentary about AI. The main purpose is reading rather than directly using a product or API reference.",
    folderPath: "AI/Articles",
  },
  {
    id: "dev_reference",
    label: "Dev / Reference",
    description:
      "Official documentation, API references, technical specifications, or implementation material useful while developing software.",
    folderPath: "Dev/Reference",
  },
  {
    id: "other",
    label: "Other",
    description:
      "Anything that does not clearly fit another configured bookmark rule.",
    folderPath: "Other",
  },
];

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  model: "jev-latest",
  maxContentChars: 12000,
  rules: [],
  setupCompleted: false,
};

const STORAGE_KEY = "semanticBookmarkSettings";

export function cloneStarterRules(): BookmarkRule[] {
  return STARTER_RULES.map((rule) => ({ ...rule }));
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const raw = (stored[STORAGE_KEY] ?? {}) as Partial<Settings>;

  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    rules: Array.isArray(raw.rules) ? raw.rules : [],
    setupCompleted: raw.setupCompleted === true,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}
