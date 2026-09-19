# Semantic Bookmark

Semantic Bookmark is a Chrome extension that organizes bookmarks using **your own semantic rules** powered by [Jev](https://typesafe.ai/).

Instead of asking AI to invent a folder structure, you define what each destination means in natural language. Jev classifies the current page, then the extension performs the deterministic Chrome bookmark action.

## MVP

The first version supports:

- BYOK Jev API key
- user-defined bookmark categories and semantic descriptions
- classification of the active page using title, URL, and visible page text
- probability/confidence preview before saving
- automatic creation of a dedicated `Semantic Bookmark` folder tree
- moving an existing bookmark instead of creating a duplicate when the URL is already bookmarked

Example rule:

```json
{
  "id": "ai_try",
  "label": "AI / Try",
  "description": "An AI product, service, library, SDK, or tool I would realistically want to try myself. Exclude news and commentary.",
  "folderPath": "AI/Try"
}
```

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

Open the extension settings, add your Jev API key, adjust the rules if you want, then use the extension popup on any normal web page.

## Product direction

The bookmark MVP is the first slice of a broader idea: **semantic organization with user-defined rules + real actions**.

Possible next steps:

- reclassify and reorganize existing bookmarks in bulk
- smart tab grouping and cleanup
- route links to different destinations such as bookmarks, read-later tools, or Obsidian
- configurable confidence thresholds for auto-apply vs. confirmation

## Security note

The Jev API key is currently stored in `chrome.storage.local` for this prototype. Do not commit API keys to the repository.

## Status

Very early prototype built to explore Jev as a semantic decision layer inside everyday software.
