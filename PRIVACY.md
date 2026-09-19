# Privacy Policy for Semantic Bookmark

Last updated: September 19, 2026

Semantic Bookmark is a Chrome extension that organizes bookmarks using user-defined semantic categories and the TypeSafe AI / Jev API.

This policy explains what data the extension handles, why it handles that data, where the data goes, and what is stored locally.

## Data handled by the extension

Semantic Bookmark may handle the following data only to provide its bookmark-classification and organization features:

- **Current page title and URL** when you analyze the active page.
- **Visible text from the current page**, up to the character limit configured in Settings, when you explicitly click **Analyze bookmark**.
- **Bookmark titles, URLs, folder structure, and bookmark IDs** when you use bookmark saving or existing-bookmark cleanup.
- **Your semantic category names, descriptions, and destination folder paths** so Jev can classify pages according to your rules.
- **Your TypeSafe/Jev API key**, which you provide yourself.

The extension does not continuously monitor browsing activity and does not send page data in the background.

## When data is sent to TypeSafe

For active-page classification, nothing is sent until you explicitly click **Analyze bookmark**. The extension then sends the page title, URL, visible page text, and your configured category definitions directly from your browser to the TypeSafe API at `https://api.typesafe.ai/`.

For existing-bookmark cleanup, the extension sends the selected bookmarks' titles and URLs, together with your configured category definitions, to the TypeSafe API when you explicitly start analysis. Historical page contents are not fetched for bulk cleanup.

Your TypeSafe API key is sent to TypeSafe as the authorization credential for those requests.

TypeSafe is a third-party service. Its handling of data is governed by its privacy policy:

https://typesafe.ai/legal/privacy-policy

Semantic Bookmark is not affiliated with or endorsed by TypeSafe AI unless explicitly stated otherwise.

## Data stored locally

Semantic Bookmark stores the following in `chrome.storage.local` on your browser:

- TypeSafe/Jev API key
- selected model
- maximum page-text setting
- semantic category definitions and destination paths

The developer of Semantic Bookmark does not operate a backend server for the extension and does not independently receive or store the page content, bookmark data, category definitions, or API key transmitted by the extension.

You can remove locally stored extension settings by uninstalling the extension or clearing its extension storage.

## Bookmark access

The extension requests Chrome's bookmarks permission so it can read bookmark folders and create, update, and move bookmarks as requested by the user.

Bulk cleanup uses a **Preview → Apply** workflow. Analysis does not move bookmarks. Bookmark changes occur only after the user reviews the proposed actions and explicitly applies them.

## How data is used

Data handled by Semantic Bookmark is used only to provide the extension's user-facing bookmark classification and organization features.

Semantic Bookmark does not:

- sell user data;
- use user data for advertising;
- use user data for credit, lending, or eligibility decisions;
- build advertising profiles;
- run analytics or tracking SDKs;
- allow the developer to read users' page or bookmark data through a developer-operated service.

## Security

Data sent to TypeSafe is transmitted over HTTPS. The TypeSafe API key is stored locally by Chrome for this prototype and is not intentionally exposed to web pages.

Users should treat their TypeSafe API key as a credential and revoke or rotate it through TypeSafe if they believe it has been compromised.

## Chrome Web Store Limited Use

The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Changes to this policy

If Semantic Bookmark changes how it handles user data, this policy and the relevant in-product disclosures will be updated before those changes are published.

## Contact

Questions or privacy concerns can be filed through the project's public GitHub issue tracker:

https://github.com/acorn181/semantic-bookmark/issues
