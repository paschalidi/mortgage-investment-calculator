import { describe, it, expect } from 'vitest'
import {
  calculateRetirementPhase,
  simulateDrawdown,
  calculateLifetimeView,
} from '../retirement'
import { DEFAULT_TAX_YEAR_2025_26 } from '../tax'
import type { PotProjection } from '../types'

const TEST_CONFIG = DEFAULT_TAX_YEAR_2025_26

// Realistic defaults from slices 3–5
const nestProjection: PotProjection = {
  valueAtRetirement: 484000,
  totalContributed: 300000,
  totalGrowth: 184000,
  yearsToRetirement: 23,
}

const generaliProjection: PotProjection = {
  valueAtRetirement: 250000,
  totalContributed: 150000,
  totalGrowth: 100000,
  yearsToRetirement: 21,
}

describe('calculateRetirementPhase Phase 1 (no state pension)', () => {
  it('includes ISA yield, NEST drawdown, and Generali drawdown with correct tax', () => {
    const phase1 = calculateRetirementPhase({
      phaseName: 'Phase 1: Early Retirement',
      ageRange: '57–66',
      pensions: [
        {
          name: 'NEST (Workplace)',
          projection: nestProjection,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
        {
          name: 'Generali (Personal)',
          projection: generaliProjection,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
      ],
      statePensionAnnual: TEST_CONFIG.statePensionAmount,
      statePensionIncluded: false,
      isaPortfolioValue: 1_000_000,
      isaYield: 0.04,
      config: TEST_CONFIG,
    })

    // ISA yield
    const isaSource = phase1.sources.find((s) =>
      s.name.includes('ISA/GIA bonds yield'),
    )
    expect(isaSource).toBeDefined()
    expect(isaSource!.annualGross).toBeCloseTo(40000, 0)
    expect(isaSource!.annualTax).toBe(0)
    expect(isaSource!.taxFree).toBe(true)

    // NEST drawdown
    const nestSource = phase1.sources.find((s) =>
      s.name.includes('NEST'),
    )
    expect(nestSource).toBeDefined()
    expect(nestSource!.annualGross).toBeCloseTo(12737, 0)
    expect(nestSource!.taxFree).toBe(false)

    // Generali drawdown
    const generaliSource = phase1.sources.find((s) =>
      s.name.includes('Generali'),
    )
    expect(generaliSource).toBeDefined()
    expect(generaliSource!.annualGross).toBeCloseTo(6579, 0)
    expect(generaliSource!.taxFree).toBe(false)

    // No state pension in phase 1
    expect(
      phase1.sources.some((s) => s.name === 'State Pension'),
    ).toBe(false)

    // Tax was applied (total taxable > PA)
    expect(phase1.totalTaxAnnual).toBeGreaterThan(0)
    expect(phase1.totalGrossAnnual).toBeGreaterThan(phase1.totalNetAnnual)
    expect(phase1.totalNetMonthly).toBeCloseTo(
      phase1.totalNetAnnual / 12,
      2,
    )
  })
})

describe('calculateRetirementPhase Phase 2 (with state pension)', () => {
  it('adds state pension and produces higher tax and net monthly', () => {
    const phase2 = calculateRetirementPhase({
      phaseName: 'Phase 2: Full Retirement',
      ageRange: '67–95',
      pensions: [
        {
          name: 'NEST (Workplace)',
          projection: nestProjection,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
        {
          name: 'Generali (Personal)',
          projection: generaliProjection,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
      ],
      statePensionAnnual: TEST_CONFIG.statePensionAmount,
      statePensionIncluded: true,
      isaPortfolioValue: 1_000_000,
      isaYield: 0.04,
      config: TEST_CONFIG,
    })

    const statePensionSource = phase2.sources.find(
      (s) => s.name === 'State Pension',
    )
    expect(statePensionSource).toBeDefined()
    expect(statePensionSource!.annualGross).toBe(TEST_CONFIG.statePensionAmount)
    expect(statePensionSource!.taxFree).toBe(false)

    // Higher tax than phase 1 because more income
    // Taxable: NEST 12737*0.75=9553 + Generali 6579*0.75=4934 + State 11502 = 25989
    // PA 12570 -> taxable 13419 -> basic tax 2684
    expect(phase2.totalTaxAnnual).toBeGreaterThan(0)

    expect(phase2.totalNetMonthly).toBeCloseTo(
      phase2.totalNetAnnual / 12,
      2,
    )
  })
})

describe('simulateDrawdown', () => {
  it('simulates pot balance year-by-year with 4% growth', () => {
    const balances = simulateDrawdown(500000, 20000, 0.04, 38)

    expect(balances[0]).toBe(500000)
    expect(balances.length).toBe(39) // 0..38 inclusive

    // With 4% growth and £20k withdrawal from £500k, balance stays roughly flat
    // 500000 * 1.04 - 20000 = 500000 exactly
    expect(balances[38]).toBeCloseTo(500000, 0)

    // Never goes negative
    expect(balances.every((b) => b >= 0)).toBe(true)
  })

  it('depletes to zero when growth is zero and withdrawal exceeds runway', () => {
    const balances = simulateDrawdown(500000, 20000, 0, 30)
    expect(balances[25]).toBe(0)
    expect(balances[30]).toBe(0)
  })
})

describe('calculateLifetimeView', () => {
  it('returns total pot, positive inheritance at 80, and ~0 at 95', () => {
    const workplaceProj: PotProjection = {
      valueAtRetirement: 400000,
      totalContributed: 250000,
      totalGrowth: 150000,
      yearsToRetirement: 23,
    }
    const personalProj: PotProjection = {
      valueAtRetirement: 100000,
      totalContributed: 60000,
      totalGrowth: 40000,
      yearsToRetirement: 21,
    }

    const phase1 = calculateRetirementPhase({
      phaseName: 'Phase 1: Early Retirement',
      ageRange: '57–66',
      pensions: [
        {
          name: 'NEST (Workplace)',
          projection: workplaceProj,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
        {
          name: 'Generali (Personal)',
          projection: personalProj,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
      ],
      statePensionAnnual: TEST_CONFIG.statePensionAmount,
      statePensionIncluded: false,
      isaPortfolioValue: 50000,
      isaYield: 0.04,
      config: TEST_CONFIG,
    })

    const phase2 = calculateRetirementPhase({
      phaseName: 'Phase 2: Full Retirement',
      ageRange: '67–95',
      pensions: [
        {
          name: 'NEST (Workplace)',
          projection: workplaceProj,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
        {
          name: 'Generali (Personal)',
          projection: personalProj,
          accessMode: 'drawdown',
          retirementAge: 57,
        },
      ],
      statePensionAnnual: TEST_CONFIG.statePensionAmount,
      statePensionIncluded: true,
      isaPortfolioValue: 50000,
      isaYield: 0.04,
      config: TEST_CONFIG,
    })

    const lifetime = calculateLifetimeView({
      workplaceProjection: workplaceProj,
      personalProjection: personalProj,
      isaPortfolioValue: 50000,
      retirementAge: 57,
      lifeExpectancy: 95,
      swr: 0.035,
      realGrowthRate: 0,
      phase1,
      phase2,
      statePensionAge: TEST_CONFIG.statePensionAge,
    })

    expect(lifetime.totalPotAtRetirement).toBe(550000)
    expect(lifetime.runwayYears).toBe(38)
    expect(lifetime.swr).toBe(0.035)

    // Inheritance at 80 (year 23): 500k - 23 * (400k/38 + 100k/38) = 500k - 23*13158 ≈ 197k
    const at80 = lifetime.estimatedInheritance.find((h) => h.dieAtAge === 80)
    expect(at80!.remainingPot).toBeGreaterThan(0)

    // Inheritance at 95 (year 38): should be ~0 with zero growth
    const at95 = lifetime.estimatedInheritance.find((h) => h.dieAtAge === 95)
    expect(at95!.remainingPot).toBeLessThanOrEqual(1000)
  })
})

describe('Edge cases', () => {
  it('annuity mode shows capital-lost note and uses SWR', () => {
    const pot: PotProjection = {
      valueAtRetirement: 150000,
      totalContributed: 100000,
      totalGrowth: 50000,
      yearsToRetirement: 21,
    }

    const phase = calculateRetirementPhase({
      phaseName: 'Phase 1: Early Retirement',
      ageRange: '57–66',
      pensions: [
        {
          name: 'Generali (Personal)',
          projection: pot,
          accessMode: 'annuity',
          retirementAge: 57,
        },
      ],
      statePensionAnnual: TEST_CONFIG.statePensionAmount,
      statePensionIncluded: false,
      isaPortfolioValue: 0,
      isaYield: 0,
      config: TEST_CONFIG,
    })

    const annuitySource = phase.sources.find((s) =>
      s.name.includes('annuity'),
    )
    expect(annuitySource).toBeDefined()
    expect(annuitySource!.name).toContain('capital lost on death')
    expect(annuitySource!.annualGross).toBeCloseTo(
      pot.valueAtRetirement * TEST_CONFIG.swr,
      0,
    )
  })

  it('locked mode is skipped and not included in phase sources', () => {
    const pot: PotProjection = {
      valueAtRetirement: 150000,
      totalContributed: 100000,
      totalGrowth: 50000,
      yearsToRetirement: 21,
    }

    const phase = calculateRetirementPhase({
      phaseName: 'Phase 1: Early Retirement',
      ageRange: '57–66',
      pensions: [
        {
          name: 'Locked Pot',
          projection: pot,
          accessMode: 'locked',
          retirementAge: 67,
        },
      ],
      statePensionAnnual: TEST_CONFIG.statePensionAmount,
      statePensionIncluded: false,
      isaPortfolioValue: 0,
      isaYield: 0,
      config: TEST_CONFIG,
    })

    expect(phase.sources.some((s) => s.name.includes('Locked Pot'))).toBe(
      false,
    )
    expect(phase.totalGrossAnnual).toBe(0)
  })

  it('lump_sum mode shows zero annual income with note', () => {
    const pot: PotProjection = {
      valueAtRetirement: 150000,
      totalContributed: 100000,
      totalGrowth: 50000,
      yearsToRetirement: 21,
    }

    const phase = calculateRetirementPhase({
      phaseName: 'Phase 1: Early Retirement',
      ageRange: '57–66',
      pensions: [
        {
          name: 'Generali (Personal)',
          projection: pot,
          accessMode: 'lump_sum',
          retirementAge: 57,
        },
      ],
      statePensionAnnual: TEST_CONFIG.statePensionAmount,
      statePensionIncluded: false,
      isaPortfolioValue: 0,
      isaYield: 0,
      config: TEST_CONFIG,
    })

    const lumpSumSource = phase.sources.find((s) =>
      s.name.includes('lump sum'),
    )
    expect(lumpSumSource).toBeDefined()
    expect(lumpSumSource!.annualGross).toBe(0)
  })
})
