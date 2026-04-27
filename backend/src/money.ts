export function parseRupeesToPaise(amount: unknown): number {
  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) throw new Error("amount must be a finite number");
    const paise = Math.round(amount * 100);
    if (!Number.isSafeInteger(paise)) throw new Error("amount too large");
    return paise;
  }

  if (typeof amount === "string") {
    const trimmed = amount.trim();
    if (!trimmed) throw new Error("amount is required");
    if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) throw new Error("amount must be a number with up to 2 decimals");
    const negative = trimmed.startsWith("-");
    const [intPart, decPartRaw] = trimmed.replace("-", "").split(".");
    const decPart = (decPartRaw ?? "").padEnd(2, "0").slice(0, 2);
    const paise = Number(intPart) * 100 + Number(decPart);
    if (!Number.isSafeInteger(paise)) throw new Error("amount too large");
    return negative ? -paise : paise;
  }

  throw new Error("amount must be a number or string");
}

export function formatPaiseToRupees(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const dec = String(abs % 100).padStart(2, "0");
  return `${sign}${rupees}.${dec}`;
}

