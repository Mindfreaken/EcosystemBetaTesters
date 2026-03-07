// Activities helpers
export function stripIds(text?: string | null): string | undefined {
  if (!text) return text ?? undefined;
  return text.replace(/\s*\(ID:[^)]+\)/gi, "");
}
