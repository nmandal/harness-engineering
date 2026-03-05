import path from "node:path";

const MARKDOWN_LINK = /\[[^\]]+\]\(([^)]+)\)/g;

export function extractMarkdownLinks(markdown: string): string[] {
  const links: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = MARKDOWN_LINK.exec(markdown)) !== null) {
    links.push(match[1]);
  }

  return links;
}

export function resolveMarkdownPath(baseFile: string, link: string): string | null {
  if (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("mailto:") || link.startsWith("#")) {
    return null;
  }

  const [pathPart] = link.split("#");
  if (!pathPart || !pathPart.endsWith(".md")) {
    return null;
  }

  return path.resolve(path.dirname(baseFile), pathPart);
}
