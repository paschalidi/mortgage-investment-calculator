import type { TaxYearConfig, PotProjection } from './types'
import { calculateIncomeTax } from './tax'

export interface RetirementIncomeSource {
  name: string
  annualGross: number
  annualTax: number
  annualNet: number
  taxFree: boolean
}

export interface RetirementPhaseIncome {
  phaseName: string
  ageRange: string
  sources: RetirementIncomeSource[]
  totalGrossAnnual: number
  totalTaxAnnual: number
  totalNetAnnual: number
  totalNetMonthly: number
  effectiveTaxRate: number
}

export interface LifetimeView {
  totalPotAtRetirement: number
  runwayYears: number
  swr: number
  estimatedInheritance: Array<{ dieAtAge: number; remainingPot: number }>
  estimatedLifetimeTaxPaid: number
}

interface PensionPotForRetirement {
  name: string
  projection: PotProjection
  accessMode: 'drawdown' | 'annuity' | 'lump_sum' | 'locked'
  retirementAge: number
}

interface TaxableSource {
  name: string
  amount: number
}

export function calculateRetirementPhase(args: {
  phaseName: string
  ageRange: string
  pensions: PensionPotForRetirement[]
  statePensionAnnual: number
  statePensionIncluded: boolean
  isaPortfolioValue: number
  isaYield: number
  config: TaxYearConfig
}): RetirementPhaseIncome {
  const {
    phaseName,
    ageRange,
    pensions,
    statePensionAnnual,
    statePensionIncluded,
    isaPortfolioValue,
    isaYield,
    config,
  } = args

  const sources: RetirementIncomeSource[] = []
  const taxableSources: TaxableSource[] = []

  // 1. ISA yield — tax-free, always included if value > 0
  if (isaPortfolioValue > 0 && isaYield > 0) {
    const isaAnnualGross = isaPortfolioValue * isaYield
    sources.push({
      name: 'ISA/GIA bonds yield',
      annualGross: isaAnnualGross,
      annualTax: 0,
      annualNet: isaAnnualGross,
      taxFree: true,
    })
  }

  // 2. State Pension — fully taxable, fills PA + basic band first
  if (statePensionIncluded && statePensionAnnual > 0) {
    taxableSources.push({
      name: 'State Pension',
      amount: statePensionAnnual,
    })
    sources.push({
      name: 'State Pension',
      annualGross: statePensionAnnual,
      annualTax: 0, // filled after total tax calculation
      annualNet: statePensionAnnual,
      taxFree: false,
    })
  }

  // 3 & 4. Pension drawdowns and annuities
  for (const pension of pensions) {
    const runway = Math.max(1, config.lifeExpectancy - pension.retirementAge)

    if (pension.accessMode === 'locked') {
      // Skip — not accessible in this phase
      continue
    }

    if (pension.accessMode === 'lump_sum') {
      sources.push({
        name: `${pension.name} (lump sum — one-time)`,
        annualGross: 0,
        annualTax: 0,
        annualNet: 0,
        taxFree: false,
      })
      continue
    }

    if (pension.accessMode === 'drawdown') {
      const annualWithdrawal = pension.projection.valueAtRetirement / runway
      const taxablePortion = annualWithdrawal * 0.75
      taxableSources.push({
        name: `${pension.name} (75% taxable)`,
        amount: taxablePortion,
      })
      sources.push({
        name: `${pension.name} (drawdown)`,
        annualGross: annualWithdrawal,
        annualTax: 0, // filled after total tax calculation
        annualNet: annualWithdrawal,
        taxFree: false,
      })
      continue
    }

    if (pension.accessMode === 'annuity') {
      const annualAnnuity = pension.projection.valueAtRetirement * config.swr
      taxableSources.push({
        name: `${pension.name} annuity`,
        amount: annualAnnuity,
      })
      sources.push({
        name: `${pension.name} (annuity — capital lost on death)`,
        annualGross: annualAnnuity,
        annualTax: 0, // filled after total tax calculation
        annualNet: annualAnnuity,
        taxFree: false,
      })
      continue
    }
  }

  // Compute total tax on stacked taxable income
  const totalTaxableIncome = taxableSources.reduce((sum, s) => sum + s.amount, 0)
  const { tax: totalTax } =
    totalTaxableIncome > 0
      ? calculateIncomeTax(totalTaxableIncome, config)
      : { tax: 0 }

  // Allocate tax back to sources proportionally
  for (const source of sources) {
    if (source.taxFree) continue

    // Find the corresponding taxable amount for this source
    let taxableAmount = 0
    if (source.name === 'State Pension') {
      taxableAmount = statePensionAnnual
    } else if (source.name.includes('(drawdown)')) {
      // Find the matching taxable source
      const baseName = source.name.replace(' (drawdown)', '')
      const matchingTaxable = taxableSources.find((t) =>
        t.name.startsWith(baseName),
      )
      taxableAmount = matchingTaxable?.amount ?? 0
    } else if (source.name.includes('(annuity')) {
      const baseName = source.name.replace(' (annuity — capital lost on death)', '')
      const matchingTaxable = taxableSources.find((t) =>
        t.name.startsWith(baseName),
      )
      taxableAmount = matchingTaxable?.amount ?? 0
    }

    const allocatedTax =
      totalTaxableIncome > 0 ? (taxableAmount / totalTaxableIncome) * totalTax : 0

    source.annualTax = allocatedTax
    source.annualNet = source.annualGross - allocatedTax
  }

  const totalGrossAnnual = sources.reduce((sum, s) => sum + s.annualGross, 0)
  const totalTaxAnnual = sources.reduce((sum, s) => sum + s.annualTax, 0)
  const totalNetAnnual = sources.reduce((sum, s) => sum + s.annualNet, 0)
  const totalNetMonthly = totalNetAnnual / 12
  const effectiveTaxRate =
    totalGrossAnnual > 0 ? (totalTaxAnnual / totalGrossAnnual) * 100 : 0

  return {
    phaseName,
    ageRange,
    sources,
    totalGrossAnnual,
    totalTaxAnnual,
    totalNetAnnual,
    totalNetMonthly,
    effectiveTaxRate,
  }
}

export function simulateDrawdown(
  initialPot: number,
  annualWithdrawal: number,
  realGrowthRate: number,
  years: number,
): number[] {
  const balances: number[] = [initialPot]
  let balance = initialPot
  for (let i = 0; i < years; i++) {
    balance = balance * (1 + realGrowthRate) - annualWithdrawal
    balance = Math.max(0, balance)
    balances.push(balance)
  }
  return balances
}

export function calculateLifetimeView(args: {
  workplaceProjection: PotProjection
  personalProjection: PotProjection
  isaPortfolioValue: number
  retirementAge: number
  lifeExpectancy: number
  swr: number
  realGrowthRate: number
  phase1: RetirementPhaseIncome
  phase2: RetirementPhaseIncome
  statePensionAge: number
}): LifetimeView {
  const {
    workplaceProjection,
    personalProjection,
    isaPortfolioValue,
    retirementAge,
    lifeExpectancy,
    swr,
    realGrowthRate,
    phase1,
    phase2,
    statePensionAge,
  } = args

  const totalPotAtRetirement =
    workplaceProjection.valueAtRetirement +
    personalProjection.valueAtRetirement +
    isaPortfolioValue

  const runwayYears = Math.max(1, lifeExpectancy - retirementAge)

  // Inheritance: simulate combined pension pot drawdown
  const combinedInitial =
    workplaceProjection.valueAtRetirement + personalProjection.valueAtRetirement

  // Sum of annual gross drawdown withdrawals from phase 2
  const annualWithdrawal = phase2.sources
    .filter((s) => s.name.includes('(drawdown)'))
    .reduce((sum, s) => sum + s.annualGross, 0)

  const balances = simulateDrawdown(
    combinedInitial,
    annualWithdrawal,
    realGrowthRate,
    runwayYears,
  )

  const estimatedInheritance = [
    { dieAtAge: 80, remainingPot: balances[Math.min(80 - retirementAge, runwayYears)] ?? 0 },
    { dieAtAge: 90, remainingPot: balances[Math.min(90 - retirementAge, runwayYears)] ?? 0 },
    { dieAtAge: 95, remainingPot: balances[Math.min(95 - retirementAge, runwayYears)] ?? 0 },
  ]

  // Rough lifetime tax estimate
  const phase1Years = Math.max(0, statePensionAge - retirementAge)
  const phase2Years = Math.max(0, lifeExpectancy - statePensionAge)
  const estimatedLifetimeTaxPaid =
    phase1.totalTaxAnnual * phase1Years +
    phase2.totalTaxAnnual * phase2Years

  return {
    totalPotAtRetirement,
    runwayYears,
    swr,
    estimatedInheritance,
    estimatedLifetimeTaxPaid,
  }
}
