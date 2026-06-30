import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { RetirementPhaseIncome, LifetimeView } from '@/lib/calculations/retirement'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

interface RetirementIncomeSummaryProps {
  phase1: RetirementPhaseIncome
  phase2: RetirementPhaseIncome
  lifetime: LifetimeView
  retirementAge: number
}

function PhaseCard({
  phase,
  note,
}: {
  phase: RetirementPhaseIncome
  note: string
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{phase.phaseName}</CardTitle>
        <CardDescription>Ages {phase.ageRange}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          {phase.sources.map((source) => (
            <div
              key={source.name}
              className="flex justify-between items-start text-sm"
            >
              <span className="text-muted-foreground">{source.name}</span>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(source.annualGross)}/yr</div>
                {source.annualTax > 0 && (
                  <div className="text-xs text-red-500">
                    -{formatCurrency(source.annualTax)} tax
                  </div>
                )}
                {source.taxFree && source.annualGross > 0 && (
                  <div className="text-xs text-green-600">Tax-free</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Gross</span>
            <span className="font-medium">{formatCurrency(phase.totalGrossAnnual)}/yr</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Tax</span>
            <span className="font-medium text-red-500">-{formatCurrency(phase.totalTaxAnnual)}/yr</span>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
            <div className="text-xs font-medium text-green-800 dark:text-green-300 uppercase tracking-wider">
              Net Monthly Income
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(phase.totalNetMonthly)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">in today's money</div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Effective tax rate</span>
            <span>{phase.effectiveTaxRate.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-muted-foreground italic">{note}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function RetirementIncomeSummary({
  phase1,
  phase2,
  lifetime,
  retirementAge,
}: RetirementIncomeSummaryProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
        Retirement Income Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PhaseCard
          phase={phase1}
          note={`${Math.max(0, 67 - retirementAge)} years before State Pension kicks in`}
        />
        <PhaseCard
          phase={phase2}
          note={`${Math.max(0, 95 - 67)} years with State Pension`}
        />
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Lifetime View</CardTitle>
            <CardDescription>
              Runway {lifetime.runwayYears} years (to age {retirementAge + lifetime.runwayYears})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm font-medium text-primary mb-1">
                Total Pot at Retirement
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(lifetime.totalPotAtRetirement)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">in today's money</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Runway</div>
                <div className="font-semibold">{lifetime.runwayYears} years</div>
              </div>
              <div>
                <div className="text-muted-foreground">SWR</div>
                <div className="font-semibold">{(lifetime.swr * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Inheritance Scenarios
              </div>
              {lifetime.estimatedInheritance.map((scenario) => (
                <div
                  key={scenario.dieAtAge}
                  className="flex justify-between items-center p-2 bg-muted/40 rounded-lg text-sm"
                >
                  <span className="text-muted-foreground">
                    Die at age {scenario.dieAtAge}
                  </span>
                  <div className="text-right">
                    <span className="font-semibold">
                      {formatCurrency(scenario.remainingPot)}
                    </span>
                    <div className="text-xs text-muted-foreground mt-0.5">in today's money</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Lifetime Tax Paid</span>
                <span className="font-medium">{formatCurrency(lifetime.estimatedLifetimeTaxPaid)}</span>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Drawdown keeps pot invested; heirs inherit remaining balance
                (tax-free if under 75, income-taxed if over).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
