# Semantic Bookmark

Semantic Bookmark is a Chrome extension that organizes bookmarks using **your own semantic rules** powered by [Jev](https://typesafe.ai/).

The core idea is deliberately not "let AI invent a filing system." **You define the classification system**: which categories exist, what each category means, and where its bookmarks should go. Jev applies those definitions as a typed Choice decision, then the extension performs the deterministic Chrome bookmark action.

## Current prototype

The extension supports:

- first-run classification setup
- add / rename / reorder / remove semantic categories
- natural-language definition for each category
- destination folder path for each category
- BYOK Jev API key
- classification of the active page using title, URL, and visible page text
- probability/confidence preview before saving
- manual override when Jev is uncertain
- automatic creation of a dedicated `Semantic Bookmark` folder tree
- moving an existing bookmark instead of creating a duplicate when the URL is already bookmarked

Example category:

- **Name:** `AI / Try`
- **Meaning:** `An AI product, service, library, SDK, or tool I would realistically want to try myself. Exclude news and commentary.`
- **Destination:** `AI/Try`

That becomes one criterion in the Jev Choice request. The user owns the taxonomy; Jev executes it.

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
3. Define or edit at least two classification categories.
4. Save and finish setup.
5. Open any normal web page and use the extension popup to classify and save it.

Destination paths are created below the top-level `Semantic Bookmark` Chrome bookmark folder.

## Product direction

The bookmark prototype is the first slice of a broader idea: **semantic organization with user-defined rules + real actions**.

Possible next steps:

- reclassify and reorganize existing bookmarks in bulk
- smart tab grouping and cleanup
- route links to different destinations such as bookmarks, read-later tools, or Obsidian
- configurable confidence thresholds for auto-apply vs. confirmation

## Security note

The Jev API key is currently stored in `chrome.storage.local` for this prototype. Do not commit API keys to the repository.

## Status

Very early prototype built to explore Jev as a semantic decision layer inside everyday software.
