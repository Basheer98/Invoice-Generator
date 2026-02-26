/** Build company address string without duplicating pincode/state when already in address */
export function buildCompanyAddr(company: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}): string {
  const addr = (company.address ?? "").trim();
  const rest = [company.city, company.state, company.pincode].filter(Boolean).join(", ").trim();
  if (!rest) return addr;
  if (!addr) return rest;
  const pincode = (company.pincode ?? "").toString().trim();
  if (pincode && (addr.endsWith(pincode) || addr.endsWith(`, ${pincode}`) || addr.endsWith(` ${pincode}`))) {
    return addr;
  }
  if (addr.endsWith(rest) || addr.includes(rest)) return addr;
  return addr + ", " + rest;
}
