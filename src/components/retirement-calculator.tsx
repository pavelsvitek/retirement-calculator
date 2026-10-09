"use client"

import { useMemo, useState, useTransition } from "react"
import { MoreHorizontal } from "lucide-react"

import { BalanceChart } from "@/components/balance-chart"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DEFAULT_INPUTS,
  formatMoneyLastsUntil,
  parseOptionalNumber,
  projectBalance,
  validateInputs,
  type CalculatorInputs,
} from "@/lib/calculator"
import { formatEuro } from "@/lib/format"

type FieldKey =
  | "startingCapitalM"
  | "monthlyGross"
  | "annualReturnPct"
  | "inflationPct"

type FieldDrafts = Record<FieldKey, string>

function toDrafts(inputs: CalculatorInputs): FieldDrafts {
  return {
    startingCapitalM: String(inputs.startingCapitalM),
    monthlyGross: String(inputs.monthlyGross),
    annualReturnPct: String(inputs.annualReturnPct),
    inflationPct: String(inputs.inflationPct),
  }
}

export function RetirementCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS)
  const [drafts, setDrafts] = useState<FieldDrafts>(() =>
    toDrafts(DEFAULT_INPUTS)
  )
  const [ageDraft, setAgeDraft] = useState(String(DEFAULT_INPUTS.currentAge))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const validationError = useMemo(() => validateInputs(inputs), [inputs])

  const emptyFields = useMemo(() => {
    return (Object.keys(drafts) as FieldKey[]).filter(
      (k) => parseOptionalNumber(drafts[k]) === null
    )
  }, [drafts])

  const result = useMemo(() => {
    if (validationError || emptyFields.length > 0) return null
    return projectBalance(inputs)
  }, [inputs, validationError, emptyFields])

  function updateField(key: FieldKey, raw: string) {
    setDrafts((prev) => ({ ...prev, [key]: raw }))
    const parsed = parseOptionalNumber(raw)
    if (parsed === null) return
    startTransition(() => {
      setInputs((prev) => ({ ...prev, [key]: parsed }))
    })
  }

  function applyAge() {
    const parsed = parseOptionalNumber(ageDraft)
    if (parsed === null) return
    startTransition(() => {
      setInputs((prev) => ({ ...prev, currentAge: parsed }))
    })
    setSettingsOpen(false)
  }

  const lastsLabel = result
    ? formatMoneyLastsUntil(
        result.depletedAt,
        inputs.endAge,
        result.lastsBeyondEnd
      )
    : "—"

  return (
    <section className="calculator-card relative w-full max-w-[720px] animate-rise rounded-[22px] bg-white px-5 py-5 shadow-[0_24px_80px_-32px_rgba(28,45,74,0.45)] ring-1 ring-black/5 sm:px-7 sm:py-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="brand-mark mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Runway
          </p>
          <h1 className="font-display text-[1.35rem] leading-tight tracking-[-0.02em] text-ink sm:text-[1.55rem]">
            How long will your money last?
          </h1>
        </div>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="mt-0.5 size-8 shrink-0 rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
                aria-label="Calculator settings"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Projection settings</DialogTitle>
              <DialogDescription>
                The demo starts at age 37. Change your current age to shift the
                runway chart.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="current-age">Current age</Label>
                <Input
                  id="current-age"
                  inputMode="decimal"
                  value={ageDraft}
                  onChange={(e) => setAgeDraft(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button onClick={applyAge} className="mt-1">
                Update projection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          id="starting-capital"
          label="Starting capital (€ million)"
          value={drafts.startingCapitalM}
          onChange={(v) => updateField("startingCapitalM", v)}
          step="0.1"
        />
        <Field
          id="annual-return"
          label="Effective annual return (%)"
          value={drafts.annualReturnPct}
          onChange={(v) => updateField("annualReturnPct", v)}
          step="0.1"
        />
        <Field
          id="monthly-gross"
          label="Monthly gross withdrawal (€)"
          value={drafts.monthlyGross}
          onChange={(v) => updateField("monthlyGross", v)}
          step="100"
        />
        <Field
          id="inflation"
          label="Annual inflation (%)"
          value={drafts.inflationPct}
          onChange={(v) => updateField("inflationPct", v)}
          step="0.1"
        />
      </div>

      <div
        className={`mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 ${
          isPending ? "opacity-70" : "opacity-100"
        } transition-opacity duration-200`}
      >
        {emptyFields.length > 0 ? (
          <p className="sm:col-span-3 text-sm text-ink-muted">
            Enter a number in each field to project your runway.
          </p>
        ) : validationError ? (
          <p className="sm:col-span-3 text-sm text-rose-600" role="alert">
            {validationError}
          </p>
        ) : (
          <>
            <Metric label="Money lasts until" value={lastsLabel} />
            <Metric
              label="Starting net / month"
              value={formatEuro(result!.startingNet)}
            />
            <Metric
              label={`Balance at age ${inputs.endAge}`}
              value={formatEuro(result!.balanceAtEnd)}
            />
          </>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        {result && !validationError && emptyFields.length === 0 ? (
          <BalanceChart
            series={result.series}
            currentAge={inputs.currentAge}
            endAge={inputs.endAge}
          />
        ) : (
          <div className="flex h-[220px] items-center justify-center rounded-xl bg-slate-50 text-sm text-ink-muted sm:h-[260px]">
            Chart appears once inputs are valid.
          </div>
        )}
      </div>
    </section>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  step,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  step?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label
        htmlFor={id}
        className="text-[12px] font-medium text-ink-muted"
      >
        {label}
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border-slate-200 bg-white text-[15px] text-ink shadow-none focus-visible:border-accent focus-visible:ring-accent/25"
      />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="animate-fade-metric">
      <p className="text-[12px] font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-[1.05rem] font-semibold tracking-tight text-ink">
        {value}
      </p>
    </div>
  )
}
