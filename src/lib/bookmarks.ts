export const ROOT_FOLDER = "Semantic Bookmark";

export type BookmarkCandidate = {
  id: string;
  title: string;
  url: string;
  currentPath: string;
};

export type BookmarkFolderOption = {
  id: string;
  label: string;
};

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
    const [current] = await chrome.bookmarks.get(existing.id);
    if (current.parentId === folder.id) {
      return current;
    }
    return chrome.bookmarks.move(existing.id, { parentId: folder.id });
  }

  return chrome.bookmarks.create({
    parentId: folder.id,
    title: input.title,
    url: input.url,
  });
}

function findNode(
  node: chrome.bookmarks.BookmarkTreeNode,
  id: string,
): chrome.bookmarks.BookmarkTreeNode | undefined {
  if (node.id === id) return node;

  for (const child of node.children ?? []) {
    const match = findNode(child, id);
    if (match) return match;
  }

  return undefined;
}

function findFolderByTitle(
  node: chrome.bookmarks.BookmarkTreeNode,
  title: string,
): chrome.bookmarks.BookmarkTreeNode | undefined {
  if (!node.url && node.title === title) return node;

  for (const child of node.children ?? []) {
    const match = findFolderByTitle(child, title);
    if (match) return match;
  }

  return undefined;
}

function collectFolderOptions(
  node: chrome.bookmarks.BookmarkTreeNode,
  parentPath: string,
  options: BookmarkFolderOption[],
) {
  if (node.url) return;

  const path = node.title
    ? parentPath
      ? `${parentPath}/${node.title}`
      : node.title
    : parentPath;

  if (node.title) {
    options.push({ id: node.id, label: path });
  }

  for (const child of node.children ?? []) {
    collectFolderOptions(child, path, options);
  }
}

function collectCandidates(
  node: chrome.bookmarks.BookmarkTreeNode,
  parentPath: string,
  candidates: BookmarkCandidate[],
  skipFolderId?: string,
) {
  if (!node.url && skipFolderId && node.id === skipFolderId) {
    return;
  }

  if (node.url) {
    candidates.push({
      id: node.id,
      title: node.title || node.url,
      url: node.url,
      currentPath: parentPath || "(root)",
    });
    return;
  }

  const path = node.title
    ? parentPath
      ? `${parentPath}/${node.title}`
      : node.title
    : parentPath;

  for (const child of node.children ?? []) {
    collectCandidates(child, path, candidates, skipFolderId);
  }
}

export async function listBookmarkFolders(): Promise<BookmarkFolderOption[]> {
  const [root] = await chrome.bookmarks.getTree();
  if (!root) return [];

  const options: BookmarkFolderOption[] = [];
  collectFolderOptions(root, "", options);
  return options;
}

export async function collectBookmarkCandidates(
  sourceFolderId: string | null,
): Promise<BookmarkCandidate[]> {
  const [root] = await chrome.bookmarks.getTree();
  if (!root) return [];

  const candidates: BookmarkCandidate[] = [];

  if (sourceFolderId) {
    const source = findNode(root, sourceFolderId);
    if (!source || source.url) {
      throw new Error("The selected bookmark folder no longer exists.");
    }

    collectCandidates(source, "", candidates);
    return candidates;
  }

  // "All bookmarks" intentionally excludes Semantic Bookmark's own managed tree
  // so a cleanup run does not immediately re-process its previous output.
  const semanticRoot = findFolderByTitle(root, ROOT_FOLDER);
  collectCandidates(root, "", candidates, semanticRoot?.id);
  return candidates;
}

export async function moveBookmarkToFolder(
  bookmarkId: string,
  folderPath: string,
): Promise<{ node: chrome.bookmarks.BookmarkTreeNode; moved: boolean }> {
  const destination = await ensureDestinationFolder(folderPath);
  const [current] = await chrome.bookmarks.get(bookmarkId);

  if (!current) {
    throw new Error("Bookmark no longer exists.");
  }

  if (current.parentId === destination.id) {
    return { node: current, moved: false };
  }

  const node = await chrome.bookmarks.move(bookmarkId, {
    parentId: destination.id,
  });

  return { node, moved: true };
}
