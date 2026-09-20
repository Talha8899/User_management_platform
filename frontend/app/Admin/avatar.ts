const AVATAR_COLORS = [
  "0D8ABC",
  "2563EB",
  "0F766E",
  "7C3AED",
  "C2410C",
  "BE123C",
];

// Return a stable avatar URL so the same user keeps the same color everywhere.
export function getAvatarUrl(name: string): string {
  const normalizedName = name.trim() || "User";
  const colorIndex = Array.from(normalizedName).reduce(
    (hash, character) =>
      (hash * 31 + character.charCodeAt(0)) % AVATAR_COLORS.length,
    0,
  );
  const backgroundColor = AVATAR_COLORS[colorIndex];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=${backgroundColor}&color=fff`;
}
