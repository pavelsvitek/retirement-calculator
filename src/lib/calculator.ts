export type CalculatorInputs = {
  /** Starting capital in millions of euros */
  startingCapitalM: number
  /** Monthly gross withdrawal in euros */
  monthlyGross: number
  /** Effective annual return as percent (e.g. 7 for 7%) */
  annualReturnPct: number
  /** Annual inflation as percent (e.g. 2.5 for 2.5%) */
  inflationPct: number
  /** Current age (simulation start) */
  currentAge: number
  /** Simulation end age */
  endAge: number
}

export type SeriesPoint = {
  age: number
  balance: number
}

export type CalculatorResult = {
  series: SeriesPoint[]
  /** Fractional age when balance hits zero, or null if beyond endAge */
  depletedAt: number | null
  balanceAtEnd: number
  startingNet: number
  lastsBeyondEnd: boolean
}

/** Anchor points taken from the source demo's "Starting net / month" readouts */
const NET_ANCHORS: Array<[number, number]> = [
  [7500, 4376],
  [8000, 4592],
  [9000, 5031],
  [9500, 5253],
  [10000, 5470],
]

/**
 * Approximate net from monthly gross using piecewise-linear interpolation
 * through the demo anchors (Dutch-style take-home approximation).
 */
export function grossToNet(monthlyGross: number): number {
  if (!Number.isFinite(monthlyGross) || monthlyGross <= 0) return 0
  if (monthlyGross <= NET_ANCHORS[0]![0]) {
    const [g0, n0] = NET_ANCHORS[0]!
    const [g1, n1] = NET_ANCHORS[1]!
    const slope = (n1 - n0) / (g1 - g0)
    return Math.max(0, n0 + slope * (monthlyGross - g0))
  }
  const last = NET_ANCHORS[NET_ANCHORS.length - 1]!
  if (monthlyGross >= last[0]) {
    const prev = NET_ANCHORS[NET_ANCHORS.length - 2]!
    const slope = (last[1] - prev[1]) / (last[0] - prev[0])
    return last[1] + slope * (monthlyGross - last[0])
  }
  for (let i = 0; i < NET_ANCHORS.length - 1; i++) {
    const [g0, n0] = NET_ANCHORS[i]!
    const [g1, n1] = NET_ANCHORS[i + 1]!
    if (monthlyGross >= g0 && monthlyGross <= g1) {
      const t = (monthlyGross - g0) / (g1 - g0)
      return n0 + t * (n1 - n0)
    }
  }
  return 0.4376 * monthlyGross + 1094
}

/**
 * Month-by-month projection matching the source demo:
 * - portfolio compounds at effective monthly rate from annual return
 * - fixed monthly withdrawal within each calendar year of the sim
 * - withdrawal steps up by annual inflation once per year
 */
export function projectBalance(inputs: CalculatorInputs): CalculatorResult {
  const {
    startingCapitalM,
    monthlyGross,
    annualReturnPct,
    inflationPct,
    currentAge,
    endAge,
  } = inputs

  const capital = Math.max(0, startingCapitalM) * 1_000_000
  const r = annualReturnPct / 100
  const i = inflationPct / 100
  const monthlyFactor = Math.pow(1 + r, 1 / 12)

  const series: SeriesPoint[] = []
  let balance = capital
  let withdrawal = Math.max(0, monthlyGross)
  let depletedAt: number | null = null

  const years = Math.max(0, Math.floor(endAge - currentAge))

  for (let year = 0; year < years; year++) {
    for (let month = 0; month < 12; month++) {
      const age = currentAge + year + month / 12
      series.push({ age, balance: Math.max(0, balance) })

      if (balance <= 0) {
        if (depletedAt === null) depletedAt = age
        balance = 0
        // Keep flat zeros for the rest of the chart
        continue
      }

      balance = balance * monthlyFactor - withdrawal
      if (balance < 0) balance = 0
    }
    withdrawal *= 1 + i
  }

  series.push({ age: endAge, balance: Math.max(0, balance) })

  const lastsBeyondEnd = depletedAt === null && balance > 0

  return {
    series,
    depletedAt,
    balanceAtEnd: Math.max(0, balance),
    startingNet: grossToNet(monthlyGross),
    lastsBeyondEnd,
  }
}

export function formatMoneyLastsUntil(
  depletedAt: number | null,
  endAge: number,
  lastsBeyondEnd: boolean
): string {
  if (lastsBeyondEnd || depletedAt === null) {
    return `Beyond age ${endAge}`
  }

  const years = Math.floor(depletedAt + 1e-9)
  let months = Math.round((depletedAt - years) * 12)
  if (months === 12) {
    return `Age ${years + 1}`
  }
  if (months === 0) {
    return `Age ${years}`
  }
  return `Age ${years} + ${months} months`
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  startingCapitalM: 2,
  monthlyGross: 10_000,
  annualReturnPct: 7,
  inflationPct: 2.5,
  currentAge: 37,
  endAge: 100,
}

export function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".")
  if (trimmed === "" || trimmed === "-" || trimmed === ".") return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return n
}

export function validateInputs(inputs: CalculatorInputs): string | null {
  if (inputs.startingCapitalM < 0) return "Starting capital can’t be negative."
  if (inputs.monthlyGross < 0) return "Withdrawal can’t be negative."
  if (inputs.annualReturnPct < -50 || inputs.annualReturnPct > 50) {
    return "Return should be between -50% and 50%."
  }
  if (inputs.inflationPct < -10 || inputs.inflationPct > 30) {
    return "Inflation should be between -10% and 30%."
  }
  if (inputs.currentAge < 18 || inputs.currentAge > 90) {
    return "Current age should be between 18 and 90."
  }
  if (inputs.endAge <= inputs.currentAge) {
    return "End age must be after your current age."
  }
  return null
}
