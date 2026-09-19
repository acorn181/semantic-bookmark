import { defineManifest } from "@crxjs/vite-plugin";

const icons = {
  "16": "icons/icon16.png",
  "32": "icons/icon32.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png",
};

export default defineManifest({
  manifest_version: 3,
  name: "Semantic Bookmark",
  version: "0.3.1",
  description:
    "Organize Chrome bookmarks with your own semantic categories using Jev decisions and preview-first cleanup.",
  homepage_url: "https://github.com/acorn181/semantic-bookmark",
  icons,
  permissions: ["activeTab", "scripting", "bookmarks", "storage"],
  host_permissions: ["https://api.typesafe.ai/*"],
  action: {
    default_title: "Semantic Bookmark",
    default_popup: "src/popup/index.html",
    default_icon: icons,
  },
  options_page: "src/options/index.html",
});
