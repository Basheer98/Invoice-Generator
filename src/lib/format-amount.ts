/**
 * Format a number as currency with comma separators (Indian locale).
 * @param n - The amount
 * @param currency - "INR" | "USD"
 * @param includeSymbol - Whether to prepend ₹ or $
 */
export function formatAmount(
  n: number,
  currency: "INR" | "USD" = "INR",
  includeSymbol = true
): string {
  const formatted = n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!includeSymbol) return formatted;
  return currency === "USD" ? `$${formatted}` : `₹${formatted}`;
}
