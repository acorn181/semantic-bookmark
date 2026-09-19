import {
  cloneDefaultRules,
  loadSettings,
  saveSettings,
  type BookmarkRule,
  type Settings,
} from "../lib/settings";

const apiKeyEl = document.querySelector<HTMLInputElement>("#api-key")!;
const modelEl = document.querySelector<HTMLInputElement>("#model")!;
const maxContentEl = document.querySelector<HTMLInputElement>("#max-content")!;
const rulesListEl = document.querySelector<HTMLDivElement>("#rules-list")!;
const warningsEl = document.querySelector<HTMLDivElement>("#warnings")!;
const criteriaPreviewEl = document.querySelector<HTMLPreElement>("#criteria-preview")!;
const folderSuggestionsEl =
  document.querySelector<HTMLDataListElement>("#folder-suggestions")!;
const addRuleButton = document.querySelector<HTMLButtonElement>("#add-rule")!;
const defaultsButton = document.querySelector<HTMLButtonElement>("#use-defaults")!;
const saveButton = document.querySelector<HTMLButtonElement>("#save")!;
const messageEl = document.querySelector<HTMLDivElement>("#message")!;

let workingRules: BookmarkRule[] = [];

function createRuleId(): string {
  return `rule_${crypto.randomUUID().replace(/-/g, "")}`;
}

function cloneRules(rules: BookmarkRule[]): BookmarkRule[] {
  return rules.map((rule) => ({ ...rule }));
}

function createBlankRule(): BookmarkRule {
  return {
    id: createRuleId(),
    label: "",
    description: "",
    folderPath: "",
  };
}

function setMessage(text: string, kind: "error" | "success" | "none" = "none") {
  messageEl.className = kind === "none" ? "" : kind;
  messageEl.textContent = text;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function getWarnings(): string[] {
  const warnings: string[] = [];
  const labels = new Map<string, number>();
  const descriptions = new Map<string, number>();
  const destinations = new Map<string, number>();

  for (const rule of workingRules) {
    const label = normalize(rule.label);
    const description = normalize(rule.description);
    const destination = normalize(rule.folderPath);

    if (label) labels.set(label, (labels.get(label) ?? 0) + 1);
    if (description) descriptions.set(description, (descriptions.get(description) ?? 0) + 1);
    if (destination) destinations.set(destination, (destinations.get(destination) ?? 0) + 1);
  }

  if ([...labels.values()].some((count) => count > 1)) {
    warnings.push("Two or more categories use the same label.");
  }

  if ([...descriptions.values()].some((count) => count > 1)) {
    warnings.push(
      "Two or more categories have identical semantic definitions. They will be hard for Jev to distinguish.",
    );
  }

  if ([...destinations.values()].some((count) => count > 1)) {
    warnings.push(
      "Multiple categories point to the same bookmark destination. This is allowed, but may make the categories redundant.",
    );
  }

  if (workingRules.length > 8) {
    warnings.push(
      "You have many categories. Fewer, clearer choices usually produce easier-to-understand classification results.",
    );
  }

  return warnings;
}

function buildCriteriaPreview(): Record<string, string> {
  return Object.fromEntries(
    workingRules.map((rule) => [
      rule.id,
      `${rule.label || "(untitled)"}: ${rule.description || "(no definition)"}`,
    ]),
  );
}

function updateDerivedUi() {
  const warnings = getWarnings();
  warningsEl.replaceChildren();

  if (warnings.length > 0) {
    const intro = document.createElement("strong");
    intro.textContent = "Check these classification choices:";

    const list = document.createElement("ul");
    for (const warning of warnings) {
      const item = document.createElement("li");
      item.textContent = warning;
      list.append(item);
    }

    warningsEl.append(intro, list);
    warningsEl.classList.add("visible");
  } else {
    warningsEl.classList.remove("visible");
  }

  criteriaPreviewEl.textContent = JSON.stringify(buildCriteriaPreview(), null, 2);
}

function makeButton(
  label: string,
  onClick: () => void,
  options: { danger?: boolean; disabled?: boolean } = {},
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = `small secondary${options.danger ? " danger" : ""}`;
  button.disabled = options.disabled === true;
  button.addEventListener("click", onClick);
  return button;
}

function renderRules() {
  rulesListEl.replaceChildren();

  workingRules.forEach((rule, index) => {
    const card = document.createElement("section");
    card.className = "rule-card";

    const header = document.createElement("div");
    header.className = "rule-header";

    const title = document.createElement("div");
    title.className = "rule-title";
    title.textContent = rule.label.trim() || `Category ${index + 1}`;

    const actions = document.createElement("div");
    actions.className = "rule-actions";
    actions.append(
      makeButton("↑", () => moveRule(index, index - 1), { disabled: index === 0 }),
      makeButton("↓", () => moveRule(index, index + 1), {
        disabled: index === workingRules.length - 1,
      }),
      makeButton("Remove", () => removeRule(index), { danger: true }),
    );

    header.append(title, actions);

    const grid = document.createElement("div");
    grid.className = "rule-grid";

    const labelWrap = document.createElement("div");
    const labelLabel = document.createElement("label");
    labelLabel.textContent = "Category name";
    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.value = rule.label;
    labelInput.placeholder = "e.g. Read Later";
    labelInput.addEventListener("input", () => {
      rule.label = labelInput.value;
      title.textContent = rule.label.trim() || `Category ${index + 1}`;
      updateDerivedUi();
    });
    labelWrap.append(labelLabel, labelInput);

    const folderWrap = document.createElement("div");
    const folderLabel = document.createElement("label");
    folderLabel.textContent = "Destination path";
    const folderInput = document.createElement("input");
    folderInput.type = "text";
    folderInput.value = rule.folderPath;
    folderInput.placeholder = "e.g. Read Later";
    folderInput.setAttribute("list", "folder-suggestions");
    folderInput.addEventListener("input", () => {
      rule.folderPath = folderInput.value;
      updateDerivedUi();
    });
    folderWrap.append(folderLabel, folderInput);

    grid.append(labelWrap, folderWrap);

    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent = "What belongs in this category?";
    const descriptionInput = document.createElement("textarea");
    descriptionInput.value = rule.description;
    descriptionInput.placeholder =
      "Describe the semantic boundary in natural language. Mention important exclusions when useful.";
    descriptionInput.addEventListener("input", () => {
      rule.description = descriptionInput.value;
      updateDerivedUi();
    });

    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent =
      "Tip: write what belongs here and what should not. Jev receives this definition as a Choice criterion.";

    card.append(header, grid, descriptionLabel, descriptionInput, hint);
    rulesListEl.append(card);
  });

  updateDerivedUi();
}

function moveRule(fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= workingRules.length) return;
  const [rule] = workingRules.splice(fromIndex, 1);
  workingRules.splice(toIndex, 0, rule);
  renderRules();
}

function removeRule(index: number) {
  workingRules.splice(index, 1);
  renderRules();
}

function validateRules(): BookmarkRule[] {
  if (workingRules.length < 2) {
    throw new Error("Create at least two classification categories for Jev Choice.");
  }

  const ids = new Set<string>();

  return workingRules.map((rule, index) => {
    const cleaned: BookmarkRule = {
      id: rule.id.trim() || createRuleId(),
      label: rule.label.trim(),
      description: rule.description.trim(),
      folderPath: rule.folderPath
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean)
        .join("/"),
    };

    if (!cleaned.label) {
      throw new Error(`Category ${index + 1} needs a name.`);
    }

    if (!cleaned.description) {
      throw new Error(`"${cleaned.label}" needs a semantic definition.`);
    }

    if (!cleaned.folderPath) {
      throw new Error(`"${cleaned.label}" needs a destination path.`);
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleaned.id)) {
      throw new Error(`Internal rule id "${cleaned.id}" is invalid.`);
    }

    if (ids.has(cleaned.id)) {
      throw new Error(`Duplicate internal rule id: ${cleaned.id}`);
    }

    ids.add(cleaned.id);
    return cleaned;
  });
}

async function loadFolderSuggestions() {
  const matches = await chrome.bookmarks.search({ title: "Semantic Bookmark" });
  const root = matches.find(
    (node) => !node.url && node.title === "Semantic Bookmark",
  );

  if (!root) return;

  const paths: string[] = [];

  async function walk(parentId: string, prefix: string) {
    const children = await chrome.bookmarks.getChildren(parentId);

    for (const child of children) {
      if (child.url) continue;

      const path = prefix ? `${prefix}/${child.title}` : child.title;
      paths.push(path);
      await walk(child.id, path);
    }
  }

  await walk(root.id, "");

  for (const path of paths.sort()) {
    const option = document.createElement("option");
    option.value = path;
    folderSuggestionsEl.append(option);
  }
}

async function init() {
  const settings = await loadSettings();

  apiKeyEl.value = settings.apiKey;
  modelEl.value = settings.model;
  maxContentEl.value = String(settings.maxContentChars);
  workingRules = cloneRules(settings.rules);

  await loadFolderSuggestions();
  renderRules();
}

addRuleButton.addEventListener("click", () => {
  workingRules.push(createBlankRule());
  renderRules();
});

defaultsButton.addEventListener("click", () => {
  workingRules = cloneDefaultRules();
  renderRules();
  setMessage("General-purpose defaults restored.", "none");
});

saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;
  setMessage("");

  try {
    const rules = validateRules();
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

    workingRules = cloneRules(rules);
    renderRules();
    setMessage("Saved. You're ready to classify bookmarks.", "success");
  } catch (error) {
    setMessage(error instanceof Error ? error.message : String(error), "error");
  } finally {
    saveButton.disabled = false;
  }
});

void init().catch((error) => {
  setMessage(error instanceof Error ? error.message : String(error), "error");
});
