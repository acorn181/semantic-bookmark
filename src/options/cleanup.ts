import {
  collectBookmarkCandidates,
  listBookmarkFolders,
  moveBookmarkToFolder,
  type BookmarkCandidate,
} from "../lib/bookmarks";
import { classifyPage, type JevChoiceResult } from "../lib/jev";
import { loadSettings, type BookmarkRule, type Settings } from "../lib/settings";

const KEEP = "__keep__";

type CleanupResult = {
  bookmark: BookmarkCandidate;
  classification?: JevChoiceResult;
  selectedRuleId: string;
  classificationError?: string;
  applyStatus?: string;
  applyError?: string;
};

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing cleanup UI element: ${selector}`);
  }
  return element;
}

export async function initBookmarkCleanup(): Promise<void> {
  const sourceEl = query<HTMLSelectElement>("#cleanup-source");
  const limitEl = query<HTMLInputElement>("#cleanup-limit");
  const analyzeButton = query<HTMLButtonElement>("#cleanup-analyze");
  const metaEl = query<HTMLDivElement>("#cleanup-meta");
  const messageEl = query<HTMLDivElement>("#cleanup-message");
  const resultsEl = query<HTMLDivElement>("#cleanup-results");
  const applyRowEl = query<HTMLDivElement>("#cleanup-apply-row");
  const applyButton = query<HTMLButtonElement>("#cleanup-apply");
  const clearButton = query<HTMLButtonElement>("#cleanup-clear");

  let results: CleanupResult[] = [];
  let sourceCountRequest = 0;
  let busy = false;

  function setMessage(
    text: string,
    kind: "error" | "success" | "none" = "none",
  ) {
    messageEl.className = kind === "none" ? "" : kind;
    messageEl.textContent = text;
  }

  function getSelectedSourceFolderId(): string | null {
    return sourceEl.value === "__all__" ? null : sourceEl.value;
  }

  function getLimit(): number {
    const value = Math.floor(Number(limitEl.value));
    if (!Number.isFinite(value) || value < 1 || value > 100) {
      throw new Error("Analyze up to must be between 1 and 100.");
    }
    return value;
  }

  function getRule(settings: Settings, id: string): BookmarkRule | undefined {
    return settings.rules.find((rule) => rule.id === id);
  }

  function clearPreview() {
    results = [];
    resultsEl.replaceChildren();
    applyRowEl.hidden = true;
    setMessage("");
    updateApplyButton();
  }

  function setBusy(value: boolean) {
    busy = value;
    sourceEl.disabled = value;
    limitEl.disabled = value;
    analyzeButton.disabled = value;
    clearButton.disabled = value;

    // Result selects are rendered while analysis/apply is busy. Re-sync them
    // when processing finishes so the preview becomes editable again.
    for (const select of resultsEl.querySelectorAll<HTMLSelectElement>("select")) {
      select.disabled = value;
    }

    updateApplyButton();
  }

  function updateApplyButton() {
    const moveCount = results.filter(
      (result) =>
        !result.classificationError &&
        result.selectedRuleId !== KEEP &&
        !result.applyStatus,
    ).length;

    applyButton.textContent =
      moveCount === 1 ? "Apply 1 move" : `Apply ${moveCount} moves`;
    applyButton.disabled = busy || moveCount === 0;
  }

  async function refreshSourceCount() {
    const requestId = ++sourceCountRequest;
    metaEl.textContent = "Counting bookmarks…";

    try {
      const candidates = await collectBookmarkCandidates(
        getSelectedSourceFolderId(),
      );

      if (requestId !== sourceCountRequest) return;

      const sourceLabel =
        sourceEl.selectedOptions[0]?.textContent ?? "Selected folder";
      metaEl.textContent = `${sourceLabel}: ${candidates.length} bookmark${
        candidates.length === 1 ? "" : "s"
      }. Analysis will make one Jev request per bookmark, up to your batch limit.`;
    } catch (error) {
      if (requestId !== sourceCountRequest) return;
      metaEl.textContent =
        error instanceof Error ? error.message : String(error);
    }
  }

  function makeProbabilityChips(
    result: CleanupResult,
    settings: Settings,
  ): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "probabilities";

    if (!result.classification) {
      return wrap;
    }

    const sorted = Object.entries(result.classification.probabilities).sort(
      (a, b) => b[1] - a[1],
    );

    for (const [id, probability] of sorted) {
      const chip = document.createElement("span");
      chip.className = "probability-chip";
      const label = getRule(settings, id)?.label ?? id;
      chip.textContent = `${label} ${Math.round(probability * 100)}%`;
      wrap.append(chip);
    }

    return wrap;
  }

  function renderResults(settings: Settings) {
    resultsEl.replaceChildren();

    for (const result of results) {
      const card = document.createElement("section");
      card.className = "cleanup-card";

      const header = document.createElement("div");
      header.className = "cleanup-header";

      const titleWrap = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = result.bookmark.title;

      const url = document.createElement("div");
      url.className = "cleanup-url";
      url.textContent = result.bookmark.url;
      url.title = result.bookmark.url;

      const current = document.createElement("div");
      current.className = "muted";
      current.textContent = `Current: ${result.bookmark.currentPath}`;

      titleWrap.append(title, url, current);
      header.append(titleWrap);

      if (result.classification) {
        const confidence = document.createElement("span");
        confidence.className = `confidence ${
          result.classification.confidence < 0.5 ? "low" : ""
        }`;
        confidence.textContent = `${Math.round(
          result.classification.confidence * 100,
        )}% confidence`;
        header.append(confidence);
      }

      card.append(header);

      if (result.classificationError) {
        const error = document.createElement("div");
        error.className = "error";
        error.textContent = `Classification failed: ${result.classificationError}`;
        card.append(error);
      } else {
        const decision = document.createElement("div");
        decision.className = "cleanup-decision";

        const selectionWrap = document.createElement("div");
        const label = document.createElement("label");
        label.textContent = "Action";

        const select = document.createElement("select");

        const keepOption = document.createElement("option");
        keepOption.value = KEEP;
        keepOption.textContent = "Keep current location";
        select.append(keepOption);

        for (const rule of settings.rules) {
          const option = document.createElement("option");
          option.value = rule.id;
          option.textContent = `${rule.label} → Semantic Bookmark/${rule.folderPath}`;
          select.append(option);
        }

        select.value = result.selectedRuleId;
        select.disabled = busy;
        select.addEventListener("change", () => {
          result.selectedRuleId = select.value;
          result.applyStatus = undefined;
          result.applyError = undefined;
          updateApplyButton();
        });

        selectionWrap.append(label, select);

        const proposedWrap = document.createElement("div");
        const proposedLabel = document.createElement("label");
        proposedLabel.textContent = "Jev suggestion";

        const proposed = document.createElement("div");
        proposed.className = "cleanup-meta";
        const suggestedRule = result.classification
          ? getRule(settings, result.classification.choice)
          : undefined;
        proposed.textContent = suggestedRule
          ? `${suggestedRule.label} → Semantic Bookmark/${suggestedRule.folderPath}`
          : "No matching configured category.";

        proposedWrap.append(proposedLabel, proposed);
        decision.append(selectionWrap, proposedWrap);
        card.append(decision, makeProbabilityChips(result, settings));
      }

      if (result.applyStatus || result.applyError) {
        const status = document.createElement("div");
        status.className = result.applyError
          ? "cleanup-status error"
          : "cleanup-status success";
        status.textContent = result.applyError ?? result.applyStatus ?? "";
        card.append(status);
      }

      resultsEl.append(card);
    }

    applyRowEl.hidden = results.length === 0;
    updateApplyButton();
  }

  async function loadFolderChoices() {
    const all = document.createElement("option");
    all.value = "__all__";
    all.textContent = "All bookmarks (excluding Semantic Bookmark output)";
    sourceEl.append(all);

    const folders = await listBookmarkFolders();

    for (const folder of folders) {
      const option = document.createElement("option");
      option.value = folder.id;
      option.textContent = folder.label;
      sourceEl.append(option);
    }
  }

  async function analyze() {
    clearPreview();
    setBusy(true);

    try {
      const settings = await loadSettings();

      if (!settings.apiKey.trim()) {
        throw new Error("Save a Jev API key before running bulk cleanup.");
      }

      if (settings.rules.length < 2) {
        throw new Error("Configure at least two saved classification categories.");
      }

      const limit = getLimit();
      const candidates = await collectBookmarkCandidates(
        getSelectedSourceFolderId(),
      );

      const batch = candidates.slice(0, limit);

      if (batch.length === 0) {
        setMessage("No bookmarks found in this source.", "none");
        return;
      }

      results = [];

      for (let index = 0; index < batch.length; index += 1) {
        const bookmark = batch[index];

        setMessage(
          `Classifying ${index + 1} of ${batch.length}: ${bookmark.title}`,
          "none",
        );

        try {
          const classification = await classifyPage(
            {
              title: bookmark.title,
              url: bookmark.url,
              content: "",
            },
            settings,
          );

          const selectedRuleId = getRule(settings, classification.choice)
            ? classification.choice
            : KEEP;

          results.push({
            bookmark,
            classification,
            selectedRuleId,
          });
        } catch (error) {
          results.push({
            bookmark,
            selectedRuleId: KEEP,
            classificationError:
              error instanceof Error ? error.message : String(error),
          });
        }

        renderResults(settings);
      }

      const remainder = candidates.length - batch.length;
      setMessage(
        remainder > 0
          ? `Preview ready. Analyzed ${batch.length} of ${candidates.length} bookmarks; ${remainder} remain in this source for another batch.`
          : `Preview ready. Analyzed all ${batch.length} bookmarks in this source.`,
        "success",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error), "error");
    } finally {
      setBusy(false);
    }
  }

  async function applyMoves() {
    const settings = await loadSettings();
    const pending = results.filter(
      (result) =>
        !result.classificationError &&
        result.selectedRuleId !== KEEP &&
        !result.applyStatus,
    );

    if (pending.length === 0) return;

    const approved = window.confirm(
      `Move ${pending.length} bookmark${
        pending.length === 1 ? "" : "s"
      } to the reviewed destinations? This is the first point where bookmarks will be changed.`,
    );

    if (!approved) return;

    setBusy(true);
    setMessage("Applying reviewed moves…", "none");

    let moved = 0;
    let unchanged = 0;
    let failed = 0;

    for (const result of pending) {
      const rule = getRule(settings, result.selectedRuleId);

      if (!rule) {
        result.applyError = "Selected category no longer exists.";
        failed += 1;
        renderResults(settings);
        continue;
      }

      try {
        const applied = await moveBookmarkToFolder(
          result.bookmark.id,
          rule.folderPath,
        );

        if (applied.moved) {
          result.applyStatus = `Moved to Semantic Bookmark/${rule.folderPath}`;
          moved += 1;
        } else {
          result.applyStatus = `Already in Semantic Bookmark/${rule.folderPath}`;
          unchanged += 1;
        }
      } catch (error) {
        result.applyError =
          error instanceof Error ? error.message : String(error);
        failed += 1;
      }

      renderResults(settings);
    }

    setMessage(
      `Apply complete: ${moved} moved, ${unchanged} already in place, ${failed} failed.`,
      failed > 0 ? "error" : "success",
    );

    setBusy(false);
    await refreshSourceCount();
  }

  sourceEl.addEventListener("change", () => {
    clearPreview();
    void refreshSourceCount();
  });

  limitEl.addEventListener("change", () => {
    clearPreview();
  });

  analyzeButton.addEventListener("click", () => {
    void analyze();
  });

  applyButton.addEventListener("click", () => {
    void applyMoves();
  });

  clearButton.addEventListener("click", () => {
    clearPreview();
  });

  await loadFolderChoices();
  await refreshSourceCount();
}
