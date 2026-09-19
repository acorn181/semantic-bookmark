import { saveOrMoveBookmark } from "../lib/bookmarks";
import { classifyPage, type JevChoiceResult, type PageState } from "../lib/jev";
import { loadSettings, type BookmarkRule, type Settings } from "../lib/settings";

const titleEl = document.querySelector<HTMLHeadingElement>("#page-title")!;
const urlEl = document.querySelector<HTMLDivElement>("#page-url")!;
const analyzeButton = document.querySelector<HTMLButtonElement>("#analyze")!;
const resultEl = document.querySelector<HTMLElement>("#result")!;
const choiceEl = document.querySelector<HTMLDivElement>("#choice")!;
const probabilitiesEl = document.querySelector<HTMLDivElement>("#probabilities")!;
const saveButton = document.querySelector<HTMLButtonElement>("#save")!;
const messageEl = document.querySelector<HTMLDivElement>("#message")!;
const optionsLink = document.querySelector<HTMLAnchorElement>("#open-options")!;

let settings: Settings;
let pageState: PageState;
let classification: JevChoiceResult | null = null;
let selectedChoice: string | null = null;

function setMessage(text: string, kind: "error" | "success" | "none" = "none") {
  messageEl.className = kind;
  messageEl.textContent = text;
}

async function getActivePage(maxContentChars: number): Promise<PageState> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    throw new Error("Could not read the active tab.");
  }

  let content = "";
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (limit: number) =>
        (document.body?.innerText ?? "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, limit),
      args: [maxContentChars],
    });
    content = String(result?.result ?? "");
  } catch {
    // Some browser-internal pages cannot be scripted. Title + URL can still be classified.
  }

  return {
    title: tab.title ?? tab.url,
    url: tab.url,
    content,
  };
}

function getRule(id: string): BookmarkRule | undefined {
  return settings.rules.find((rule) => rule.id === id);
}

function renderResult(result: JevChoiceResult) {
  if (!selectedChoice) {
    selectedChoice = result.choice;
  }

  const selectedRule = getRule(selectedChoice);
  choiceEl.replaceChildren();

  const strong = document.createElement("strong");
  strong.textContent = getRule(result.choice)?.label ?? result.choice;

  const confidenceText = document.createTextNode(
    ` · ${Math.round(result.confidence * 100)}% confidence`,
  );

  choiceEl.append(strong, confidenceText);

  if (result.confidence < 0.5) {
    const note = document.createElement("div");
    note.className = "subtle";
    note.textContent = "Low confidence — choose the destination below if needed.";
    choiceEl.append(note);
  }

  probabilitiesEl.replaceChildren();
  const sorted = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]);

  for (const [id, probability] of sorted) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `probability ${id === selectedChoice ? "selected" : ""}`;
    row.setAttribute("aria-pressed", String(id === selectedChoice));

    const name = document.createElement("span");
    name.textContent = getRule(id)?.label ?? id;

    const value = document.createElement("span");
    value.textContent = `${Math.round(probability * 100)}%`;

    row.append(name, value);
    row.addEventListener("click", () => {
      selectedChoice = id;
      renderResult(result);
    });
    probabilitiesEl.append(row);
  }

  saveButton.textContent = selectedRule
    ? `Save to ${selectedRule.folderPath}`
    : "Save bookmark";
  resultEl.style.display = "block";
}

async function init() {
  settings = await loadSettings();
  pageState = await getActivePage(settings.maxContentChars);

  titleEl.textContent = pageState.title;
  urlEl.textContent = pageState.url;

  if (!settings.apiKey) {
    setMessage("Set your Jev API key in Settings first.", "error");
  }
}

analyzeButton.addEventListener("click", async () => {
  analyzeButton.disabled = true;
  saveButton.disabled = true;
  classification = null;
  selectedChoice = null;
  resultEl.style.display = "none";
  setMessage("");

  try {
    settings = await loadSettings();
    pageState = await getActivePage(settings.maxContentChars);
    classification = await classifyPage(pageState, settings);
    renderResult(classification);
    saveButton.disabled = false;
  } catch (error) {
    setMessage(error instanceof Error ? error.message : String(error), "error");
  } finally {
    analyzeButton.disabled = false;
  }
});

saveButton.addEventListener("click", async () => {
  if (!classification || !selectedChoice) return;

  const rule = getRule(selectedChoice);
  if (!rule) {
    setMessage(`No rule configured for "${selectedChoice}".`, "error");
    return;
  }

  saveButton.disabled = true;
  setMessage("");

  try {
    await saveOrMoveBookmark({
      title: pageState.title,
      url: pageState.url,
      folderPath: rule.folderPath,
    });
    setMessage(`Saved to Semantic Bookmark/${rule.folderPath}`, "success");
  } catch (error) {
    setMessage(error instanceof Error ? error.message : String(error), "error");
  } finally {
    saveButton.disabled = false;
  }
});

optionsLink.addEventListener("click", (event) => {
  event.preventDefault();
  void chrome.runtime.openOptionsPage();
});

void init().catch((error) => {
  setMessage(error instanceof Error ? error.message : String(error), "error");
});
