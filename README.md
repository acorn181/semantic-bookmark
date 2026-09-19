# Semantic Bookmark

Semantic Bookmark is a Chrome extension that organizes bookmarks using **your own semantic rules** powered by [Jev](https://typesafe.ai/).

The core idea is deliberately not "let AI invent a filing system." The extension ships with a useful general-purpose taxonomy so you can start immediately, while still letting **you define the classification system**: which categories exist, what each category means, and where its bookmarks should go.

Jev applies those definitions as a typed Choice decision, then the extension performs deterministic Chrome bookmark actions.

## Current prototype

The extension supports:

- useful default categories: Read Later, Tools & Services, Reference, Shopping & Wishlist, Other
- add / rename / reorder / remove semantic categories
- natural-language definition for each category
- destination folder path for each category
- BYOK Jev API key
- classification of the active page using title, URL, and visible page text
- probability/confidence preview before saving
- manual override when Jev is uncertain
- automatic creation of a dedicated `Semantic Bookmark` folder tree
- moving an existing bookmark instead of creating a duplicate when the URL is already bookmarked
- **bulk cleanup of existing bookmarks with Preview → Apply**

The defaults are ready to use. A new user only needs to provide a Jev API key before analyzing bookmarks.

## Existing bookmark cleanup

Settings includes a cleanup workflow for bookmarks you already have:

1. Choose a bookmark folder/subtree, or all bookmarks.
2. Pick a batch size (up to 100).
3. Analyze the batch with your saved semantic categories.
4. Review each proposed destination, confidence, and probability distribution.
5. Override any decision or choose **Keep current location**.
6. Apply the reviewed moves in one explicit action.

Nothing moves during analysis. The existing-bookmark cleanup intentionally starts with **title + URL only**, which keeps the first version predictable and avoids fetching every historical page. It currently makes one Jev request per analyzed bookmark.

When **All bookmarks** is selected, the extension excludes its own `Semantic Bookmark` output tree so completed cleanup work is not immediately reprocessed.

## Development

Requirements:

- Node.js 20+
- Chrome / Chromium
- a TypeSafe/Jev API key

Install and build:

```bash
npm install
npm run build
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `dist` directory.

On first use:

1. Open extension **Settings**.
2. Add your Jev API key.
3. Save settings.
4. Open any normal web page and use the extension popup to classify and save it.

You can customize the classification categories at any time. Destination paths are created below the top-level `Semantic Bookmark` Chrome bookmark folder.

## Product principle

The default taxonomy exists to remove onboarding friction. The durable product behavior is still:

> Human defines meaning → Jev makes the semantic decision → deterministic software takes action.

## Product direction

The bookmark prototype is the first slice of a broader idea: **semantic organization with user-defined rules + real actions**.

Possible next steps:

- smart tab grouping and cleanup
- route links to different destinations such as bookmarks, read-later tools, or Obsidian
- configurable confidence thresholds for auto-apply vs. confirmation
- optional page-content enrichment for historical bookmark cleanup

## Security note

The Jev API key is currently stored in `chrome.storage.local` for this prototype. Do not commit API keys to the repository.

## Status

Early prototype built to explore Jev as a semantic decision layer inside everyday software.
