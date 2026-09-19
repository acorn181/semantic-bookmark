import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Semantic Bookmark",
  version: "0.3.0",
  description: "Organize bookmarks with your own semantic rules using Jev.",
  permissions: ["activeTab", "scripting", "bookmarks", "storage"],
  host_permissions: ["https://api.typesafe.ai/*"],
  action: {
    default_title: "Semantic Bookmark",
    default_popup: "src/popup/index.html",
  },
  options_page: "src/options/index.html",
});
