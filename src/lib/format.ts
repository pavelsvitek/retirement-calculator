/** European-style euro formatting: € 5.470 / € 4.188.138 */
export function formatEuro(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return "€ —"
  const rounded =
    fractionDigits === 0 ? Math.round(value) : Number(value.toFixed(fractionDigits))
  const [intPart, fracPart] = Math.abs(rounded).toFixed(fractionDigits).split(".")
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  const sign = rounded < 0 ? "-" : ""
  const decimals = fracPart !== undefined && fractionDigits > 0 ? `,${fracPart}` : ""
  return `${sign}€ ${withDots}${decimals}`
}

/** Compact axis labels: €500k, €1.5m, €2m */
export function formatEuroCompact(value: number): string {
  if (!Number.isFinite(value)) return "€—"
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000
    const text = Number.isInteger(m) ? `${m}` : m.toFixed(1).replace(/\.0$/, "")
    return `${sign}€${text}m`
  }
  if (abs >= 1_000) {
    const k = abs / 1_000
    const text = Number.isInteger(k) ? `${k}` : k.toFixed(0)
    return `${sign}€${text}k`
  }
  return `${sign}€${Math.round(abs)}`
}

export function formatAgeHover(age: number, balance: number): string {
  const ageText = age.toFixed(1)
  return `Age ${ageText} · ${formatEuro(balance)} remaining`
}
