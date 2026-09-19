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
  rules: DEFAULT_RULES,
};

const STORAGE_KEY = "semanticBookmarkSettings";

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(stored[STORAGE_KEY] ?? {}),
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}
