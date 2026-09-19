const ROOT_FOLDER = "Semantic Bookmark";

async function findOrCreateChildFolder(
  parentId: string,
  title: string,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  const children = await chrome.bookmarks.getChildren(parentId);
  const existing = children.find((node) => !node.url && node.title === title);
  if (existing) {
    return existing;
  }

  return chrome.bookmarks.create({
    parentId,
    title,
  });
}

async function getOrCreateRootFolder(): Promise<chrome.bookmarks.BookmarkTreeNode> {
  const matches = await chrome.bookmarks.search({ title: ROOT_FOLDER });
  const existing = matches.find((node) => !node.url && node.title === ROOT_FOLDER);

  if (existing) {
    return existing;
  }

  return chrome.bookmarks.create({ title: ROOT_FOLDER });
}

export async function ensureDestinationFolder(
  folderPath: string,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  let current = await getOrCreateRootFolder();
  const segments = folderPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    current = await findOrCreateChildFolder(current.id, segment);
  }

  return current;
}

export async function saveOrMoveBookmark(input: {
  title: string;
  url: string;
  folderPath: string;
}): Promise<chrome.bookmarks.BookmarkTreeNode> {
  const folder = await ensureDestinationFolder(input.folderPath);
  const matches = await chrome.bookmarks.search({ url: input.url });
  const existing = matches.find((node) => node.url === input.url);

  if (existing) {
    await chrome.bookmarks.update(existing.id, { title: input.title });
    return chrome.bookmarks.move(existing.id, { parentId: folder.id });
  }

  return chrome.bookmarks.create({
    parentId: folder.id,
    title: input.title,
    url: input.url,
  });
}
