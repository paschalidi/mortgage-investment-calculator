import { describe, it, expect } from 'vitest'
import {
  calculateAutoSacrifice,
  projectWorkplacePot,
  projectPersonalPot,
  calculateStatePensionAge,
  calculateYearsToRetirement,
  calculateWithdrawalStrategy,
} from '../pension'
import { DEFAULT_TAX_YEAR_2025_26 } from '../tax'
import type { WorkplacePot, PersonalPot } from '../types'

describe('calculateAutoSacrifice', () => {
  it('calculates sacrifice for gross=110k target=99k', () => {
    const result = calculateAutoSacrifice(
      110000,
      99000,
      DEFAULT_TAX_YEAR_2025_26,
    )
    expect(result.annualSacrifice).toBe(11000)
    expect(result.monthlySacrifice).toBeCloseTo(916.67, 2)
    expect(result.cappedByAnnualAllowance).toBe(false)
  })

  it('returns zero when gross equals target', () => {
    const result = calculateAutoSacrifice(
      99000,
      99000,
      DEFAULT_TAX_YEAR_2025_26,
    )
    expect(result.annualSacrifice).toBe(0)
    expect(result.monthlySacrifice).toBe(0)
    expect(result.cappedByAnnualAllowance).toBe(false)
  })

  it('returns zero when gross is below target', () => {
    const result = calculateAutoSacrifice(
      50000,
      99000,
      DEFAULT_TAX_YEAR_2025_26,
    )
    expect(result.annualSacrifice).toBe(0)
    expect(result.monthlySacrifice).toBe(0)
    expect(result.cappedByAnnualAllowance).toBe(false)
  })

  it('caps at annual allowance when required exceeds cap', () => {
    const result = calculateAutoSacrifice(
      200000,
      99000,
      DEFAULT_TAX_YEAR_2025_26,
    )
    expect(result.annualSacrifice).toBe(60000)
    expect(result.monthlySacrifice).toBe(5000)
    expect(result.cappedByAnnualAllowance).toBe(true)
  })
})

describe('projectWorkplacePot', () => {
  const defaultNestPot: WorkplacePot = {
    currentValue: 2000,
    monthlySacrifice: 916.67,
    employerMatchPercent: 5,
    matchBaseSalary: 110000,
    realGrowthRate: 0.04,
    amc: 0.003,
    contributionCharge: 0.018,
    accessMode: 'drawdown',
    retirementAge: 57,
  }

  it('projects NEST-like pot with fees over 23 years', () => {
    const result = projectWorkplacePot(defaultNestPot, 23)
    expect(result.valueAtRetirement).toBeGreaterThan(result.totalContributed)
    expect(result.totalContributed).toBeCloseTo(372669.9, 1)
    expect(result.valueAtRetirement).toBeCloseTo(592973.6, 1)
    expect(result.yearsToRetirement).toBe(23)
  })

  it('shows fee drag by comparing with zero-fee projection', () => {
    const withFees = projectWorkplacePot(defaultNestPot, 23)
    const noFees: WorkplacePot = {
      ...defaultNestPot,
      amc: 0,
      contributionCharge: 0,
    }
    const withoutFees = projectWorkplacePot(noFees, 23)
    expect(withoutFees.valueAtRetirement).toBeGreaterThan(
      withFees.valueAtRetirement,
    )
    expect(withoutFees.totalContributed).toBeCloseTo(379500.9, 1)
    expect(withoutFees.valueAtRetirement).toBeCloseTo(628082.3, 1)
  })

  it('returns currentValue when yearsToRetirement is 0', () => {
    const result = projectWorkplacePot(defaultNestPot, 0)
    expect(result.valueAtRetirement).toBe(2000)
    expect(result.totalContributed).toBe(0)
    expect(result.totalGrowth).toBe(0)
  })
})

describe('projectPersonalPot', () => {
  it('projects forward from currentValue > 0', () => {
    const pot: PersonalPot = {
      currentValue: 40000,
      monthlyContribution: 400,
      realGrowthRate: 0.04,
      startYear: 2019,
      ukTaxRelief: false,
      accessMode: 'locked',
      retirementAge: 67,
    }
    const result = projectPersonalPot(pot, 2026, 67, '1992-02-16', 34)
    expect(result.yearsToRetirement).toBe(33)
    expect(result.totalContributed).toBeCloseTo(192000, 0)
    expect(result.valueAtRetirement).toBeGreaterThan(
      40000 + 158400,
    )
    // Snapshot: substantial value after 33 years of £400/mo + £40k start @ 4%
    expect(result.valueAtRetirement).toBeCloseTo(478728.2, 1)
  })

  it('reconstructs from startYear when currentValue is 0', () => {
    const pot: PersonalPot = {
      currentValue: 0,
      monthlyContribution: 400,
      realGrowthRate: 0.04,
      startYear: 2019,
      ukTaxRelief: false,
      accessMode: 'drawdown',
      retirementAge: 67,
    }
    const result = projectPersonalPot(pot, 2026, 67, '1992-02-16', 34)
    // 7 years past (2019->2026) + 33 future = 40 total years
    expect(result.totalContributed).toBeCloseTo(192000, 0)
    expect(result.valueAtRetirement).toBeGreaterThan(result.totalContributed)
    expect(result.yearsToRetirement).toBe(33)
    // Snapshot: reconstructed + forward projection
    expect(result.valueAtRetirement).toBeCloseTo(474360.5, 1)
  })

  it('reconstruction plus forward matches continuous projection', () => {
    // Step 1: full 40-year reconstruction from 0
    const fullPot: PersonalPot = {
      currentValue: 0,
      monthlyContribution: 400,
      realGrowthRate: 0.04,
      startYear: 2019,
      ukTaxRelief: false,
      accessMode: 'drawdown',
      retirementAge: 67,
    }
    const full = projectPersonalPot(fullPot, 2026, 67, '1992-02-16', 34)

    // Step 2: reconstruct just the past phase (7 years) by setting retirementAge = currentAge
    const pastOnlyPot: PersonalPot = {
      ...fullPot,
      retirementAge: 34,
    }
    const pastOnly = projectPersonalPot(
      pastOnlyPot,
      2026,
      34,
      '1992-02-16',
      34,
    )

    // Step 3: forward-project from the reconstructed balance for 33 years
    const forwardPot: PersonalPot = {
      ...fullPot,
      currentValue: pastOnly.valueAtRetirement,
    }
    const forward = projectPersonalPot(
      forwardPot,
      2026,
      67,
      '1992-02-16',
      34,
    )

    // The forward-only from reconstructed balance should match full reconstruction
    expect(forward.valueAtRetirement).toBeCloseTo(
      full.valueAtRetirement,
      0,
    )
    expect(forward.totalContributed).toBeCloseTo(192000, 0)
  })
})

describe('calculateYearsToRetirement', () => {
  it('returns ~22 years for DOB 1992-02-16 retiring at 57 from 2026-06-30', () => {
    const baseDate = new Date('2026-06-30')
    const years = calculateYearsToRetirement(
      '1992-02-16',
      57,
      baseDate,
    )
    expect(years).toBeGreaterThanOrEqual(22)
    expect(years).toBeLessThanOrEqual(23)
    expect(years).toBe(22)
  })

  it('returns 0 when already past retirement age', () => {
    const baseDate = new Date('2050-06-30')
    const years = calculateYearsToRetirement(
      '1992-02-16',
      57,
      baseDate,
    )
    expect(years).toBe(0)
  })
})

describe('calculateStatePensionAge', () => {
  it('returns default 67', () => {
    expect(calculateStatePensionAge('1992-02-16')).toBe(67)
    expect(calculateStatePensionAge('1992-02-16', 67)).toBe(67)
  })
})

describe('calculateWithdrawalStrategy', () => {
  it('drawdown pots produce correct TFLS and taxable income', () => {
    const strategy = calculateWithdrawalStrategy(
      {
        workplace: {
          valueAtRetirement: 580500,
          totalContributed: 372669,
          totalGrowth: 207831,
          yearsToRetirement: 23,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
        personal: {
          valueAtRetirement: 150000,
          totalContributed: 100000,
          totalGrowth: 50000,
          yearsToRetirement: 33,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
        statePensionAnnual: 11502,
        statePensionAge: 67,
        retirementAge: 57,
        lifeExpectancy: 95,
        swr: 0.035,
        currentAge: 34,
      },
      DEFAULT_TAX_YEAR_2025_26,
    )

    expect(strategy.drawdownRunwayYears).toBe(38)

    const expectedTFLS = (580500 + 150000) * 0.25
    expect(strategy.taxFreeLumpSum).toBeCloseTo(expectedTFLS, 0)

    const expectedTaxableAnnual =
      (580500 * 0.75) / 38 + (150000 * 0.75) / 38
    expect(strategy.taxableIncome).toBeCloseTo(expectedTaxableAnnual, 0)

    // No state pension yet (currentAge 34 < 67)
    expect(
      strategy.sources.some((s) => s.name === 'State Pension'),
    ).toBe(false)
  })

  it('includes state pension when currentAge >= statePensionAge', () => {
    const strategy = calculateWithdrawalStrategy(
      {
        workplace: {
          valueAtRetirement: 580500,
          totalContributed: 372669,
          totalGrowth: 207831,
          yearsToRetirement: 23,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
        statePensionAnnual: 11502,
        statePensionAge: 67,
        retirementAge: 67,
        lifeExpectancy: 95,
        swr: 0.035,
        currentAge: 70,
      },
      DEFAULT_TAX_YEAR_2025_26,
    )

    const statePensionSource = strategy.sources.find(
      (s) => s.name === 'State Pension',
    )
    expect(statePensionSource).toBeDefined()
    expect(statePensionSource!.annualAmount).toBe(11502)
    expect(strategy.annualIncome).toBeGreaterThan(11502)
  })

  it('locked pot contributes zero annual income', () => {
    const strategy = calculateWithdrawalStrategy(
      {
        workplace: {
          valueAtRetirement: 580500,
          totalContributed: 372669,
          totalGrowth: 207831,
          yearsToRetirement: 23,
          accessMode: 'locked',
          retirementAge: 57,
        },
        statePensionAnnual: 11502,
        statePensionAge: 67,
        retirementAge: 57,
        lifeExpectancy: 95,
        swr: 0.035,
        currentAge: 34,
      },
      DEFAULT_TAX_YEAR_2025_26,
    )

    const workplaceSource = strategy.sources.find(
      (s) => s.name === 'Workplace',
    )
    expect(workplaceSource).toBeDefined()
    expect(workplaceSource!.annualAmount).toBe(0)
    expect(strategy.taxFreeLumpSum).toBe(0)
    expect(strategy.taxableIncome).toBe(0)
  })

  it('annuity pot uses SWR for approximate annual income', () => {
    const strategy = calculateWithdrawalStrategy(
      {
        personal: {
          valueAtRetirement: 150000,
          totalContributed: 100000,
          totalGrowth: 50000,
          yearsToRetirement: 33,
          accessMode: 'annuity',
          retirementAge: 57,
        },
        statePensionAnnual: 11502,
        statePensionAge: 67,
        retirementAge: 57,
        lifeExpectancy: 95,
        swr: 0.035,
        currentAge: 34,
      },
      DEFAULT_TAX_YEAR_2025_26,
    )

    const expectedAnnuity = 150000 * 0.035
    expect(strategy.annualIncome).toBeCloseTo(expectedAnnuity, 0)
    expect(strategy.taxableIncome).toBeCloseTo(expectedAnnuity, 0)
  })
})
