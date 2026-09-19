# Chrome Web Store submission notes

This file contains copy-paste-ready fields for the initial public Chrome Web Store submission.

## Store listing

**Name**

Semantic Bookmark

**Summary / short description**

Organize Chrome bookmarks with your own semantic categories using Jev decisions and preview-first cleanup.

**Primary category**

Workflow & Planning

**Language**

English

**Detailed description**

Semantic Bookmark organizes Chrome bookmarks according to meanings that you define.

Instead of asking AI to invent a folder system, you choose the categories, describe what belongs in each one, and map each category to a Chrome bookmark destination. Jev then makes a typed semantic Choice, shows its confidence and probability distribution, and Semantic Bookmark performs the reviewed Chrome bookmark action.

Features:

- Ready-to-use general bookmark categories
- Fully editable category names and semantic definitions
- Custom destination folder paths
- Active-page classification using title, URL, and visible page text
- Confidence and probability preview before saving
- Manual destination override
- Preview-first bulk cleanup for existing bookmarks
- Keep-current-location option during cleanup
- No background browsing-history collection
- Bring-your-own TypeSafe/Jev API key

For active-page analysis, the extension sends the page title, URL, visible page text, and category definitions to TypeSafe/Jev only after you click Analyze. Existing-bookmark cleanup sends bookmark titles and URLs only after you start analysis.

The extension does not run ads or analytics and does not operate a developer backend that receives your browsing or bookmark data.

TypeSafe/Jev account and API usage are provided separately by TypeSafe AI.

## URLs

**Homepage**

https://github.com/acorn181/semantic-bookmark

**Support**

https://github.com/acorn181/semantic-bookmark/issues

**Privacy policy**

https://github.com/acorn181/semantic-bookmark/blob/main/PRIVACY.md

## Graphic assets

Already prepared in the repository:

- Extension/store icon: `public/icons/icon128.png`
- Small promo tile: `store-assets/small-promo-440x280.png`

Still required before submission:

- At least one **1280×800** screenshot. Up to five can be supplied.

Suggested screenshots:

1. Popup after Analyze, showing classification probabilities and manual override.
2. Settings page showing editable semantic categories.
3. Existing-bookmark cleanup preview before Apply.

Optional:

- 1400×560 marquee promo tile
- YouTube demo video

## Privacy practices: single purpose

> Organize Chrome bookmarks into user-defined semantic categories using Jev classification, with user review before bookmark changes are applied.

## Permission justifications

**activeTab**

> Used only after the user invokes the extension so Semantic Bookmark can identify the current active page for the user-facing classification feature.

**scripting**

> Used after the user explicitly clicks Analyze to read visible text from the active tab. The extracted text is used only to classify that page into the user's configured bookmark categories.

**bookmarks**

> Required to read bookmark folders and to create, update, and move bookmarks. It is also used for the explicit Preview → Apply existing-bookmark cleanup feature.

**storage**

> Used to store the user's TypeSafe/Jev API key, model setting, page-text limit, semantic category definitions, and destination paths locally in chrome.storage.local.

**Host permission: https://api.typesafe.ai/***

> Required to send explicit classification requests directly from the extension to the TypeSafe/Jev API using the user's own API key.

## Remote code

Select:

> No, I am not using remote code.

Reason: Semantic Bookmark calls a remote API for classification data, but does not download or execute JavaScript, WebAssembly, or other executable code from TypeSafe.

## Data-use declarations

The dashboard wording can change. Select the matching data categories for the behavior actually implemented, including:

- Website content / resources — visible page text is read when the user explicitly analyzes the current page.
- Web browsing activity / URLs — the active page URL and bookmark URLs are used for classification.
- Authentication information — the user-provided TypeSafe API key is stored locally and sent to TypeSafe for API authentication.
- User-generated content, if offered as a category — user-written semantic category definitions are included in Jev classification requests.

Do **not** declare advertising, analytics, selling data, credit-worthiness, or unrelated tracking; Semantic Bookmark does none of those.

Certify the Chrome Web Store Limited Use statements only if the submitted build continues to match `PRIVACY.md`.

## Distribution

Recommended initial visibility: **Public**.

All visibility modes are reviewed under the same policy requirements, so using Unlisted does not avoid review.

## Submission package

The workflow `.github/workflows/store-package.yml` builds the extension and uploads a ZIP artifact whose root contains `manifest.json`.

For manual packaging:

```bash
npm install
npm run build
cd dist
zip -r ../semantic-bookmark-cws.zip .
```

Upload the resulting ZIP to the Chrome Web Store Developer Dashboard.

## Release/version note

The first GitHub release was `v0.3.0`. Store-readiness changes bump the extension to `0.3.1`, so publish/tag `v0.3.1` after this preparation PR is merged.
