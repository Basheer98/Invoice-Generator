/**
 * Converts a number to Indian-style amount in words (e.g. "Forty Seven Thousand Three Hundred and Seventy Seven")
 */
const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];
const teens = [
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertLessThanThousand(n: number): string {
  if (n === 0) return "";
  let result = "";
  if (n >= 100) {
    result += ones[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    result += tens[Math.floor(n / 10)] + " ";
    n %= 10;
  } else if (n >= 10) {
    result += teens[n - 10] + " ";
    return result.trim();
  }
  if (n > 0) {
    result += ones[n] + " ";
  }
  return result.trim();
}

export function amountInWords(amount: number): string {
  if (amount === 0) return "Zero Only";

  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);

  if (intPart === 0) {
    return `${decPart}/100 Only`;
  }

  let result = "";
  let n = intPart;

  if (n >= 10000000) {
    const crore = Math.floor(n / 10000000);
    result += convertLessThanThousand(crore) + " Crore ";
    n %= 10000000;
  }
  if (n >= 100000) {
    const lakh = Math.floor(n / 100000);
    result += convertLessThanThousand(lakh) + " Lakh ";
    n %= 100000;
  }
  if (n >= 1000) {
    const thousand = Math.floor(n / 1000);
    result += convertLessThanThousand(thousand) + " Thousand ";
    n %= 1000;
  }
  if (n > 0) {
    result += convertLessThanThousand(n) + " ";
  }

  result = result.trim();

  if (decPart > 0) {
    result += ` and ${decPart}/100`;
  }

  return result + " Only";
}
