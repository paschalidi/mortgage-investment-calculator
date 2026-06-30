import type {
  TaxYearConfig,
  WorkplacePot,
  PersonalPot,
  PotProjection,
  WithdrawalStrategy,
  AutoSacrificeResult,
} from './types'

export function calculateAutoSacrifice(
  grossSalary: number,
  targetANI: number,
  config: TaxYearConfig,
): AutoSacrificeResult {
  const requiredSacrifice = Math.max(0, grossSalary - targetANI)
  const capped = requiredSacrifice > config.pensionAnnualAllowance
  const annualSacrifice = Math.min(
    requiredSacrifice,
    config.pensionAnnualAllowance,
  )
  const monthlySacrifice = annualSacrifice / 12

  return {
    monthlySacrifice,
    annualSacrifice,
    cappedByAnnualAllowance: capped,
  }
}

export function projectWorkplacePot(
  pot: WorkplacePot,
  yearsToRetirement: number,
): PotProjection {
  const totalMonths = yearsToRetirement * 12
  let balance = pot.currentValue
  let totalContributed = 0
  let totalGrowth = 0
  const monthlyRate = pot.realGrowthRate / 12
  const monthlyAMC = pot.amc / 12

  for (let month = 0; month < totalMonths; month++) {
    const employerMatch =
      (pot.employerMatchPercent / 100) * (pot.matchBaseSalary / 12)
    const totalContribution = pot.monthlySacrifice + employerMatch
    const netContribution = totalContribution * (1 - pot.contributionCharge)
    const growth = (balance + netContribution) * monthlyRate
    balance = balance * (1 - monthlyAMC)
    balance += netContribution + growth
    totalContributed += netContribution
    totalGrowth += growth
  }

  return {
    valueAtRetirement: balance,
    totalContributed,
    totalGrowth,
    yearsToRetirement,
  }
}

export function projectPersonalPot(
  pot: PersonalPot,
  currentYear: number,
  retirementAge: number,
  _dob: string,
  currentAge: number,
): PotProjection {
  const yearsToRetirement = Math.max(0, retirementAge - currentAge)
  const totalFutureMonths = yearsToRetirement * 12
  const monthlyRate = pot.realGrowthRate / 12

  let balance = 0
  let totalContributed = 0
  let totalGrowth = 0

  // Past phase: reconstruct from startYear to currentYear (for contributed/growth accounting)
  const pastMonths = (currentYear - pot.startYear) * 12
  for (let month = 0; month < pastMonths; month++) {
    const growth = (balance + pot.monthlyContribution) * monthlyRate
    balance += pot.monthlyContribution + growth
    totalContributed += pot.monthlyContribution
    totalGrowth += growth
  }

  // If user provided a currentValue > 0, use it as ground truth for future projection
  if (pot.currentValue > 0) {
    balance = pot.currentValue
  }

  // Future phase: project forward yearsToRetirement
  for (let month = 0; month < totalFutureMonths; month++) {
    const growth = (balance + pot.monthlyContribution) * monthlyRate
    balance += pot.monthlyContribution + growth
    totalContributed += pot.monthlyContribution
    totalGrowth += growth
  }

  return {
    valueAtRetirement: balance,
    totalContributed,
    totalGrowth,
    yearsToRetirement,
  }
}

export function calculateStatePensionAge(
  _dob: string,
  defaultAge: number = 67,
): number {
  return defaultAge
}

export function calculateYearsToRetirement(
  dob: string,
  retirementAge: number,
  baseDate: Date = new Date(),
): number {
  if (!dob) return 0
  const birthDate = new Date(dob)
  const targetYear = birthDate.getFullYear() + retirementAge
  const targetDate = new Date(
    targetYear,
    birthDate.getMonth(),
    birthDate.getDate(),
  )

  let years = targetDate.getFullYear() - baseDate.getFullYear()
  const m = targetDate.getMonth() - baseDate.getMonth()
  if (m < 0 || (m === 0 && targetDate.getDate() < baseDate.getDate())) {
    years--
  }
  return Math.max(0, years)
}

export function calculateWithdrawalStrategy(
  args: {
    workplace?: PotProjection & {
      accessMode: string
      retirementAge: number
      name?: string
    }
    personal?: PotProjection & {
      accessMode: string
      retirementAge: number
      name?: string
    }
    statePensionAnnual: number
    statePensionAge: number
    retirementAge: number
    lifeExpectancy: number
    swr: number
    currentAge: number
  },
  _config: TaxYearConfig,
): WithdrawalStrategy {
  const drawdownRunwayYears = Math.max(
    1,
    args.lifeExpectancy - args.retirementAge,
  )
  const sources: Array<{ name: string; annualAmount: number; taxFree: boolean }> =
    []
  let annualIncome = 0
  let taxableIncome = 0
  let taxFreeLumpSum = 0

  const processPot = (
    pot:
      | (PotProjection & {
          accessMode: string
          retirementAge: number
          name?: string
        })
      | undefined,
    defaultName: string,
  ): void => {
    if (!pot) return
    const name = pot.name ?? defaultName
    const unlocked = pot.retirementAge <= args.retirementAge

    if (!unlocked || pot.accessMode === 'locked') {
      sources.push({ name, annualAmount: 0, taxFree: false })
      return
    }

    if (pot.accessMode === 'drawdown') {
      const potTFLS = pot.valueAtRetirement * 0.25
      const potTaxableAnnual =
        (pot.valueAtRetirement * 0.75) / drawdownRunwayYears
      taxFreeLumpSum += potTFLS
      annualIncome += potTaxableAnnual
      taxableIncome += potTaxableAnnual
      sources.push({ name, annualAmount: potTaxableAnnual, taxFree: false })
      return
    }

    if (pot.accessMode === 'annuity') {
      const potAnnuityAnnual = pot.valueAtRetirement * args.swr
      annualIncome += potAnnuityAnnual
      taxableIncome += potAnnuityAnnual
      sources.push({ name, annualAmount: potAnnuityAnnual, taxFree: false })
      return
    }

    if (pot.accessMode === 'lump_sum') {
      sources.push({ name, annualAmount: 0, taxFree: false })
      return
    }

    sources.push({ name, annualAmount: 0, taxFree: false })
  }

  processPot(args.workplace, 'Workplace')
  processPot(args.personal, 'Personal')

  if (args.retirementAge >= args.statePensionAge) {
    annualIncome += args.statePensionAnnual
    taxableIncome += args.statePensionAnnual
    sources.push({
      name: 'State Pension',
      annualAmount: args.statePensionAnnual,
      taxFree: false,
    })
  }

  return {
    annualIncome,
    taxFreeLumpSum,
    taxableIncome,
    drawdownRunwayYears,
    sources,
  }
}
