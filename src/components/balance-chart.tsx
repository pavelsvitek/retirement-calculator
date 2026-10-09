"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { SeriesPoint } from "@/lib/calculator"
import { formatAgeHover, formatEuroCompact } from "@/lib/format"

type BalanceChartProps = {
  series: SeriesPoint[]
  currentAge: number
  endAge: number
}

/** Downsample to ~one point per ~0.25 year for smooth hover without huge DOM */
function downsample(series: SeriesPoint[], maxPoints = 260): SeriesPoint[] {
  if (series.length <= maxPoints) return series
  const step = Math.ceil(series.length / maxPoints)
  const out: SeriesPoint[] = []
  for (let i = 0; i < series.length; i += step) out.push(series[i]!)
  const last = series[series.length - 1]!
  if (out[out.length - 1]?.age !== last.age) out.push(last)
  return out
}

function ageTicks(currentAge: number, endAge: number): number[] {
  const anchors = [currentAge, 45, 55, 65, 75, 85, endAge]
  return anchors.filter(
    (a, idx, arr) => a >= currentAge && a <= endAge && arr.indexOf(a) === idx
  )
}

export function BalanceChart({ series, currentAge, endAge }: BalanceChartProps) {
  const data = useMemo(() => downsample(series), [series])
  const [hover, setHover] = useState<{ age: number; balance: number } | null>(
    null
  )

  const ticks = useMemo(
    () => ageTicks(currentAge, endAge),
    [currentAge, endAge]
  )

  const footer = hover
    ? formatAgeHover(hover.age, hover.balance)
    : `Age ${currentAge}–${endAge} · nominal euros`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">
          Remaining balance
        </h2>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Balance (€)
        </span>
      </div>

      <div
        className="h-[220px] w-full sm:h-[260px]"
        title={`Remaining balance, age ${currentAge} to ${endAge}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            onMouseMove={(state) => {
              const payload = (
                state as {
                  activePayload?: Array<{ payload?: SeriesPoint }>
                }
              )?.activePayload?.[0]?.payload
              if (payload) {
                setHover({ age: payload.age, balance: payload.balance })
              }
            }}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2F6FED" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#2F6FED" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#E6EAF0"
              strokeDasharray="0"
              vertical={false}
            />
            <XAxis
              dataKey="age"
              type="number"
              domain={[currentAge, endAge]}
              ticks={ticks}
              tickLine={false}
              axisLine={{ stroke: "#E6EAF0" }}
              tick={{ fill: "#8B93A7", fontSize: 11 }}
              label={{
                value: "Age (years)",
                position: "insideBottom",
                offset: -2,
                style: { fill: "#8B93A7", fontSize: 11 },
              }}
            />
            <YAxis
              dataKey="balance"
              tickFormatter={formatEuroCompact}
              width={52}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#8B93A7", fontSize: 11 }}
            />
            <Tooltip content={() => null} cursor={{ stroke: "#C5CDD9" }} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#2F6FED"
              strokeWidth={2.25}
              fill="url(#balanceFill)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#2F6FED",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={550}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p
        className="min-h-[1.25rem] text-[12px] text-ink-muted transition-opacity duration-200"
        aria-live="polite"
      >
        {footer}
      </p>
    </div>
  )
}
