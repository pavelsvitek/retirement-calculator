import { RetirementCalculator } from "@/components/retirement-calculator"

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="atmosphere" aria-hidden="true" />
      <div className="atmosphere-grain" aria-hidden="true" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <RetirementCalculator />
        <p className="mt-6 max-w-md text-center text-[12px] leading-relaxed text-white/70">
          Interactive runway projection in nominal euros — returns compound
          monthly, withdrawals keep pace with inflation each year.
        </p>
      </main>
    </div>
  )
}
