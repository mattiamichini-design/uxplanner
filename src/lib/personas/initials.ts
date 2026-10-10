/** One badge for a persona everywhere: initials of each word ("Persona 1" → "P1"), or the first two letters of a single word. */
export function personaInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.map(word => word[0]).join('').slice(0, 3).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}
