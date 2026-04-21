export function formatSidebarName(fullName: string, maxChars = 22): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  if (trimmed.length <= maxChars) return trimmed;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return trimmed;

  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} ${last}`;
}
