import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkplacePotCard, PersonalPotCard } from './PensionPotCard'
import { Glossary } from './Glossary'
import { RetirementIncomeSummary } from './RetirementIncomeSummary'
import { HelpTip } from './HelpTip'
import {
  projectWorkplacePot,
  projectPersonalPot,
  calculateYearsToRetirement,
} from '@/lib/calculations/pension'
import {
  calculateRetirementPhase,
  calculateLifetimeView,
} from '@/lib/calculations/retirement'
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
  isaPortfolioValue?: number
  isaYieldAtRetirement?: number
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
  isaPortfolioValue,
  isaYieldAtRetirement,
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

  const phase1 = useMemo(() => {
    return calculateRetirementPhase({
      phaseName: 'Phase 1: Early Retirement',
      ageRange: `${retirementAge}–${config.statePensionAge - 1}`,
      pensions: [
        {
          name: 'NEST (Workplace)',
          projection: workplaceProjection,
          accessMode: workplacePot.accessMode,
          retirementAge: workplacePot.retirementAge,
        },
        {
          name: 'Generali (Personal)',
          projection: personalProjection,
          accessMode: personalPot.accessMode,
          retirementAge: personalPot.retirementAge,
        },
      ],
      statePensionAnnual: config.statePensionAmount,
      statePensionIncluded: false,
      isaPortfolioValue: isaPortfolioValue ?? 0,
      isaYield: isaYieldAtRetirement ?? 0,
      config,
    })
  }, [workplaceProjection, workplacePot.accessMode, workplacePot.retirementAge, personalProjection, personalPot.accessMode, personalPot.retirementAge, config, retirementAge, isaPortfolioValue, isaYieldAtRetirement])

  const phase2 = useMemo(() => {
    return calculateRetirementPhase({
      phaseName: 'Phase 2: Full Retirement',
      ageRange: `${config.statePensionAge}–${config.lifeExpectancy}`,
      pensions: [
        {
          name: 'NEST (Workplace)',
          projection: workplaceProjection,
          accessMode: workplacePot.accessMode,
          retirementAge: workplacePot.retirementAge,
        },
        {
          name: 'Generali (Personal)',
          projection: personalProjection,
          accessMode: personalPot.accessMode,
          retirementAge: personalPot.retirementAge,
        },
      ],
      statePensionAnnual: config.statePensionAmount,
      statePensionIncluded: true,
      isaPortfolioValue: isaPortfolioValue ?? 0,
      isaYield: isaYieldAtRetirement ?? 0,
      config,
    })
  }, [workplaceProjection, workplacePot.accessMode, workplacePot.retirementAge, personalProjection, personalPot.accessMode, personalPot.retirementAge, config, isaPortfolioValue, isaYieldAtRetirement])

  const lifetime = useMemo(() => {
    return calculateLifetimeView({
      workplaceProjection,
      personalProjection,
      isaPortfolioValue: isaPortfolioValue ?? 0,
      retirementAge,
      lifeExpectancy: config.lifeExpectancy,
      swr: config.swr,
      realGrowthRate: workplacePot.realGrowthRate,
      phase1,
      phase2,
      statePensionAge: config.statePensionAge,
    })
  }, [workplaceProjection, personalProjection, isaPortfolioValue, retirementAge, config.lifeExpectancy, config.swr, config.statePensionAge, workplacePot.realGrowthRate, phase1, phase2])

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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>All projections shown in today's money (inflation-adjusted).</span>
          <HelpTip content="Real return = nominal investment return MINUS inflation. £1M shown in 2049 = same purchasing power as £1M today. Edit inflation rate in the Assumptions panel (default 2.5%)." />
        </div>
      </div>

      <Glossary />

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

      <Card className="bg-slate-50 dark:bg-slate-900 border-primary/20">
        <CardHeader>
          <CardTitle>Retirement Income Summary</CardTitle>
          <CardDescription>Combined pots, State Pension, and drawdown strategy at age {retirementAge}.</CardDescription>
        </CardHeader>
        <CardContent>
          <RetirementIncomeSummary
            phase1={phase1}
            phase2={phase2}
            lifetime={lifetime}
            retirementAge={retirementAge}
          />
        </CardContent>
      </Card>
    </div>
  )
}
