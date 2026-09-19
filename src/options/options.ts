import {
  loadSettings,
  saveSettings,
  type BookmarkRule,
  type Settings,
} from "../lib/settings";

const apiKeyEl = document.querySelector<HTMLInputElement>("#api-key")!;
const modelEl = document.querySelector<HTMLInputElement>("#model")!;
const maxContentEl = document.querySelector<HTMLInputElement>("#max-content")!;
const rulesEl = document.querySelector<HTMLTextAreaElement>("#rules")!;
const saveButton = document.querySelector<HTMLButtonElement>("#save")!;
const messageEl = document.querySelector<HTMLDivElement>("#message")!;

function setMessage(text: string, kind: "error" | "success") {
  messageEl.className = kind;
  messageEl.textContent = text;
}

function validateRules(value: unknown): BookmarkRule[] {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error("Rules must be a JSON array with at least two entries.");
  }

  const rules = value as BookmarkRule[];
  const ids = new Set<string>();

  for (const [index, rule] of rules.entries()) {
    if (
      !rule ||
      typeof rule.id !== "string" ||
      typeof rule.label !== "string" ||
      typeof rule.description !== "string" ||
      typeof rule.folderPath !== "string" ||
      !rule.id.trim() ||
      !rule.label.trim() ||
      !rule.description.trim() ||
      !rule.folderPath.trim()
    ) {
      throw new Error(`Rule ${index + 1} is missing a required string field.`);
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(rule.id)) {
      throw new Error(
        `Rule id "${rule.id}" may only contain letters, numbers, "_" and "-".`,
      );
    }

    if (ids.has(rule.id)) {
      throw new Error(`Duplicate rule id: ${rule.id}`);
    }

    ids.add(rule.id);
  }

  return rules;
}

async function init() {
  const settings = await loadSettings();
  apiKeyEl.value = settings.apiKey;
  modelEl.value = settings.model;
  maxContentEl.value = String(settings.maxContentChars);
  rulesEl.value = JSON.stringify(settings.rules, null, 2);
}

saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;

  try {
    const rules = validateRules(JSON.parse(rulesEl.value));
    const maxContentChars = Number(maxContentEl.value);

    if (!Number.isFinite(maxContentChars) || maxContentChars < 500) {
      throw new Error("Maximum page text characters must be at least 500.");
    }

    const settings: Settings = {
      apiKey: apiKeyEl.value.trim(),
      model: modelEl.value.trim() || "jev-latest",
      maxContentChars,
      rules,
    };

    await saveSettings(settings);
    setMessage("Saved.", "success");
  } catch (error) {
    setMessage(error instanceof Error ? error.message : String(error), "error");
  } finally {
    saveButton.disabled = false;
  }
});

void init().catch((error) => {
  setMessage(error instanceof Error ? error.message : String(error), "error");
});
