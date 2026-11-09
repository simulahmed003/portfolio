// Turns the accent colour chosen in admin into CSS variables, with readable text on top of it.
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
export const DEFAULT_ACCENT = "#e3a061";

function rgb(hex: string) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function validAccent(v: string) {
  return HEX.test(v.trim()) ? v.trim() : DEFAULT_ACCENT;
}

export function themeVars(accent: string): Record<string, string> {
  const a = validAccent(accent);
  return { "--accent": a, "--accent-ink": luminance(a) > 0.32 ? "#14100b" : "#ffffff" };
}
