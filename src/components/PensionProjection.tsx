import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkplacePotCard, PersonalPotCard } from './PensionPotCard'
import {
  projectWorkplacePot,
  projectPersonalPot,
  calculateYearsToRetirement,
  calculateWithdrawalStrategy,
} from '@/lib/calculations/pension'
import { calculateAgeAtEnd } from '@/lib/calculations/age'
import type { WorkplacePot, PersonalPot, PartnerPot, TaxYearConfig } from '@/lib/calculations'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
}

interface PensionProjectionProps {
  grossSalary: number
  config: TaxYearConfig
  dob: string
  workplacePot: WorkplacePot
  personalPot: PersonalPot
  partnerPot: PartnerPot
  retirementAge: number
  onWorkplaceChange: (next: WorkplacePot) => void
  onPersonalChange: (next: PersonalPot) => void
  onPartnerChange: (next: PartnerPot) => void
  onRetirementAgeChange: (age: number) => void
}

export function PensionProjection({
  grossSalary,
  config,
  dob,
  workplacePot,
  personalPot,
  partnerPot,
  retirementAge,
  onWorkplaceChange,
  onPersonalChange,
  onPartnerChange,
  onRetirementAgeChange,
}: PensionProjectionProps) {
  const currentAge = useMemo(() => calculateAgeAtEnd(dob, 0) ?? 0, [dob])
  const currentYear = new Date().getFullYear()

  const workplaceYears = useMemo(
    () => calculateYearsToRetirement(dob, workplacePot.retirementAge),
    [dob, workplacePot.retirementAge],
  )
  const workplaceProjection = useMemo(
    () => projectWorkplacePot(workplacePot, workplaceYears),
    [workplacePot, workplaceYears],
  )

  const personalProjection = useMemo(
    () => projectPersonalPot(personalPot, currentYear, personalPot.retirementAge, dob, currentAge),
    [personalPot, currentYear, personalPot.retirementAge, dob, currentAge],
  )

  const withdrawalStrategy = useMemo(() => {
    return calculateWithdrawalStrategy(
      {
        workplace: {
          ...workplaceProjection,
          accessMode: workplacePot.accessMode,
          retirementAge: workplacePot.retirementAge,
          name: 'Workplace',
        },
        personal: {
          ...personalProjection,
          accessMode: personalPot.accessMode,
          retirementAge: personalPot.retirementAge,
          name: 'Personal',
        },
        statePensionAnnual: config.statePensionAmount,
        statePensionAge: config.statePensionAge,
        retirementAge,
        lifeExpectancy: config.lifeExpectancy,
        swr: config.swr,
        currentAge,
      },
      config,
    )
  }, [workplaceProjection, workplacePot.accessMode, workplacePot.retirementAge, personalProjection, personalPot.accessMode, personalPot.retirementAge, config, retirementAge, currentAge])

  const totalPotValue = (workplaceProjection?.valueAtRetirement ?? 0) + (personalProjection?.valueAtRetirement ?? 0)

  const handlePartnerChange = (value: string) => {
    const num = Number(value)
    if (Number.isNaN(num)) return
    onPartnerChange({ ...partnerPot, monthlyContribution: num })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold border-b pb-2 flex-1">Part 5: Pension Projection</h2>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="retirementAge" className="text-sm font-medium whitespace-nowrap">Retire at age</Label>
          <Input
            id="retirementAge"
            type="number"
            className="w-20 h-8"
            value={retirementAge === 0 ? '' : retirementAge}
            onChange={(e) => onRetirementAgeChange(Number(e.target.value))}
          />
          <span className="text-sm text-muted-foreground">(projections recalculate live)</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <WorkplacePotCard
          pot={workplacePot}
          onChange={onWorkplaceChange}
          projection={workplaceProjection}
          grossSalary={grossSalary}
          targetANI={99000}
          config={config}
        />

        <PersonalPotCard
          pot={personalPot}
          onChange={onPersonalChange}
          projection={personalProjection}
        />

        <Card>
          <CardHeader>
            <CardTitle>Partner Pension</CardTitle>
            <CardDescription>Simple monthly contribution (no projection).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-monthlyContribution">Monthly Contribution (£)</Label>
              <Input
                id="partner-monthlyContribution"
                type="number"
                value={partnerPot.monthlyContribution === 0 ? '' : partnerPot.monthlyContribution}
                onChange={(e) => handlePartnerChange(e.target.value)}
              />
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Annual Drain</div>
              <div className="text-xl font-bold">{formatCurrency(partnerPot.monthlyContribution * 12)}</div>
              <p className="text-xs text-muted-foreground mt-1">Shown in budget as partner pension outgoing.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retirement Income Summary */}
      <Card className="bg-slate-50 dark:bg-slate-900 border-primary/20">
        <CardHeader>
          <CardTitle>Retirement Income Summary</CardTitle>
          <CardDescription>Combined pots, State Pension, and drawdown strategy at age {retirementAge}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm font-medium text-primary mb-1">Total Pot Value</div>
              <div className="text-3xl font-bold text-primary">{formatCurrency(totalPotValue)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Workplace {formatCurrency(workplaceProjection.valueAtRetirement)} + Personal {formatCurrency(personalProjection.valueAtRetirement)}
              </div>
            </div>

            <div className="p-4 bg-green-100 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Annual Retirement Income</div>
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">{formatCurrency(withdrawalStrategy.annualIncome)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                From unlocked pots + State Pension
              </div>
            </div>

            <div className="p-4 bg-muted/40 rounded-lg border">
              <div className="text-sm font-medium text-muted-foreground mb-1">Drawdown Runway</div>
              <div className="text-3xl font-bold">{withdrawalStrategy.drawdownRunwayYears} years</div>
              <div className="text-xs text-muted-foreground mt-1">
                Funds last until age {retirementAge + withdrawalStrategy.drawdownRunwayYears}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Income Breakdown by Source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {withdrawalStrategy.sources.map((source) => (
                <div key={source.name} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-sm">
                  <span className="text-muted-foreground">{source.name}</span>
                  <span className={`font-semibold ${source.annualAmount > 0 ? '' : 'text-muted-foreground'}`}>
                    {source.annualAmount > 0 ? formatCurrency(source.annualAmount) : 'Locked'}
                  </span>
                </div>
              ))}
              {/* State Pension is only shown in sources if currentAge >= statePensionAge; always show it separately for clarity */}
              {currentAge < config.statePensionAge && (
                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-sm">
                  <span className="text-muted-foreground">State Pension</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(config.statePensionAmount)}/yr from age {config.statePensionAge}
                  </span>
                </div>
              )}
            </div>
          </div>

          {withdrawalStrategy.taxFreeLumpSum > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Tax-Free Lump Sum (TFLS)</div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(withdrawalStrategy.taxFreeLumpSum)}</div>
              <p className="text-xs text-muted-foreground mt-1">25% of each drawdown pot taken at retirement.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
