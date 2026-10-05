export function normalizeInlineNumberedSteps(content: string) {
  const markers = content.match(/\s\d+\.\s+/g);
  if (!markers || markers.length < 2) return content;

  return content.replace(/\s+(?=\d+\.\s+)/g, "\n\n");
}
