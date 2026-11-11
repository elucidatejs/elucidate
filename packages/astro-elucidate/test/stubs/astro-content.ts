// Stands in for Astro's `astro:content` virtual module in unit tests.
let entries: unknown[] = [];

export function setEntries(next: unknown[]): void {
  entries = next;
}

export async function getCollection(): Promise<unknown[]> {
  return entries;
}
