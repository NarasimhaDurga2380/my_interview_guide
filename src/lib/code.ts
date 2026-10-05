export function stripCodeFences(value: string) {
  return value
    .trim()
    .replace(/^```(?:[a-z0-9+#.-]+)?[ \t]*/i, "")
    .replace(/[ \t]*```\s*$/, "")
    .trim();
}

export function stripCodeComments(value: string) {
  return stripCodeFences(value)
    .replace(/(^|\r?\n)[ \t]*\/\/[^\r\n]*(?=\r?\n|$)/g, "$1")
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, ""))
    .replace(/(^|\r?\n)[ \t]*#(?!include\b)[^\r\n]*(?=\r?\n|$)/gi, "$1")
    .replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\r\n]/g, ""))
    .trim();
}
