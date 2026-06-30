import { describe, it, expect } from 'vitest'
import {
  DEFAULT_TAX_YEAR_2025_26,
  calculateIncomeTax,
  calculateNI,
  calculateTakeHome,
  calculateANI,
  generateMarginalRateCurve,
  calculateChildBenefitCharge,
  costOfOnePoundOver100k,
} from '../tax'

describe('DEFAULT_TAX_YEAR_2025_26', () => {
  it('has correct UK 2025/26 default values', () => {
    expect(DEFAULT_TAX_YEAR_2025_26.personalAllowance).toBe(12570)
    expect(DEFAULT_TAX_YEAR_2025_26.basicRateLimit).toBe(50270)
    expect(DEFAULT_TAX_YEAR_2025_26.higherRateLimit).toBe(125140)
    expect(DEFAULT_TAX_YEAR_2025_26.additionalRateThreshold).toBe(125140)
    expect(DEFAULT_TAX_YEAR_2025_26.basicRate).toBe(0.20)
    expect(DEFAULT_TAX_YEAR_2025_26.higherRate).toBe(0.40)
    expect(DEFAULT_TAX_YEAR_2025_26.additionalRate).toBe(0.45)
    expect(DEFAULT_TAX_YEAR_2025_26.niPrimaryThreshold).toBe(12570)
    expect(DEFAULT_TAX_YEAR_2025_26.niRate).toBe(0.08)
    expect(DEFAULT_TAX_YEAR_2025_26.niUpperEarningsLimit).toBe(50270)
    expect(DEFAULT_TAX_YEAR_2025_26.niUpperRate).toBe(0.02)
    expect(DEFAULT_TAX_YEAR_2025_26.dividendAllowance).toBe(500)
    expect(DEFAULT_TAX_YEAR_2025_26.dividendBasicRate).toBe(0.0875)
    expect(DEFAULT_TAX_YEAR_2025_26.dividendHigherRate).toBe(0.3375)
    expect(DEFAULT_TAX_YEAR_2025_26.dividendAdditionalRate).toBe(0.3935)
    expect(DEFAULT_TAX_YEAR_2025_26.cgtAnnualExempt).toBe(3000)
    expect(DEFAULT_TAX_YEAR_2025_26.cgtBasicRate).toBe(0.18)
    expect(DEFAULT_TAX_YEAR_2025_26.cgtHigherRate).toBe(0.24)
    expect(DEFAULT_TAX_YEAR_2025_26.isaAllowance).toBe(20000)
    expect(DEFAULT_TAX_YEAR_2025_26.pensionAnnualAllowance).toBe(60000)
    expect(DEFAULT_TAX_YEAR_2025_26.statePensionAmount).toBe(11502)
    expect(DEFAULT_TAX_YEAR_2025_26.statePensionAge).toBe(67)
    expect(DEFAULT_TAX_YEAR_2025_26.pensionAccessAge).toBe(57)
    expect(DEFAULT_TAX_YEAR_2025_26.inflationRate).toBe(0.025)
    expect(DEFAULT_TAX_YEAR_2025_26.swr).toBe(0.035)
    expect(DEFAULT_TAX_YEAR_2025_26.lifeExpectancy).toBe(95)
  })
})

describe('calculateIncomeTax', () => {
  it('returns zero tax for gross=0', () => {
    const result = calculateIncomeTax(0, DEFAULT_TAX_YEAR_2025_26)
    expect(result.tax).toBe(0)
    expect(result.bands[0].taxable).toBe(12570)
    expect(result.bands[0].tax).toBe(0)
    expect(result.bands[1].taxable).toBe(0)
    expect(result.bands[2].taxable).toBe(0)
    expect(result.bands[3].taxable).toBe(0)
  })

  it('returns zero tax for gross=12570 (exactly PA)', () => {
    const result = calculateIncomeTax(12570, DEFAULT_TAX_YEAR_2025_26)
    expect(result.tax).toBe(0)
    expect(result.bands[0].taxable).toBe(12570)
    expect(result.bands[1].taxable).toBe(0)
  })

  it('calculates correct tax for gross=50270', () => {
    const result = calculateIncomeTax(50270, DEFAULT_TAX_YEAR_2025_26)
    // PA = 12570, taxable = 37700, basic = 37700 @ 20% = 7540
    expect(result.tax).toBeCloseTo(7540, 2)
    expect(result.bands[1].taxable).toBe(37700)
    expect(result.bands[1].tax).toBeCloseTo(7540, 2)
    expect(result.bands[2].taxable).toBe(0)
  })

  it('calculates correct tax for gross=100000', () => {
    const result = calculateIncomeTax(100000, DEFAULT_TAX_YEAR_2025_26)
    // PA = 12570, taxable = 87430
    // basic = 37700 @ 20% = 7540
    // higher = 49730 @ 40% = 19892
    expect(result.tax).toBeCloseTo(27432, 2)
    expect(result.bands[1].taxable).toBe(37700)
    expect(result.bands[2].taxable).toBeCloseTo(49730, 2)
    expect(result.bands[3].taxable).toBe(0)
  })

  it('demonstrates 60% marginal trap between 100k and 125k', () => {
    const at100k = calculateIncomeTax(100000, DEFAULT_TAX_YEAR_2025_26)
    const at100001 = calculateIncomeTax(100001, DEFAULT_TAX_YEAR_2025_26)
    const deltaTax = at100001.tax - at100k.tax
    // £1 extra income costs ~£0.60 extra tax = 60% marginal (income tax only)
    expect(deltaTax).toBeCloseTo(0.6, 2)
  })

  it('calculates correct tax for gross=125140', () => {
    const result = calculateIncomeTax(125140, DEFAULT_TAX_YEAR_2025_26)
    // PA = 0, taxable = 125140
    // basic = 37700 @ 20% = 7540
    // higher = 87440 @ 40% = 34976
    expect(result.tax).toBeCloseTo(42516, 2)
    expect(result.bands[0].taxable).toBe(0)
    expect(result.bands[1].taxable).toBe(37700)
    expect(result.bands[2].taxable).toBeCloseTo(87440, 2)
    expect(result.bands[3].taxable).toBe(0)
  })

  it('calculates correct tax for gross=150000', () => {
    const result = calculateIncomeTax(150000, DEFAULT_TAX_YEAR_2025_26)
    // PA = 0, taxable = 150000
    // basic = 37700 @ 20% = 7540
    // higher = 87440 @ 40% = 34976
    // additional = 24860 @ 45% = 11187
    expect(result.tax).toBeCloseTo(53703, 2)
    expect(result.bands[3].taxable).toBeCloseTo(24860, 2)
  })

  it('includes Personal Allowance band in breakdown', () => {
    const result = calculateIncomeTax(60000, DEFAULT_TAX_YEAR_2025_26)
    expect(result.bands[0].name).toBe('Personal Allowance')
    expect(result.bands[0].tax).toBe(0)
    expect(result.bands[0].rate).toBe(0)
  })
})

describe('calculateNI', () => {
  it('returns 0 for gross=0', () => {
    expect(calculateNI(0, DEFAULT_TAX_YEAR_2025_26)).toBe(0)
  })

  it('returns 0 for gross=12570', () => {
    expect(calculateNI(12570, DEFAULT_TAX_YEAR_2025_26)).toBe(0)
  })

  it('calculates correct NI for gross=50000', () => {
    // 8% * (50000 - 12570) = 37430 * 0.08 = 2994.4
    expect(calculateNI(50000, DEFAULT_TAX_YEAR_2025_26)).toBeCloseTo(2994.4, 2)
  })

  it('calculates correct NI for gross=50270 (exactly at UEL)', () => {
    // 8% * (50270 - 12570) = 37700 * 0.08 = 3016
    expect(calculateNI(50270, DEFAULT_TAX_YEAR_2025_26)).toBeCloseTo(3016, 2)
  })

  it('calculates correct NI for gross=110000', () => {
    // 8% * 37700 + 2% * (110000 - 50270) = 3016 + 1194.60 = 4210.60
    expect(calculateNI(110000, DEFAULT_TAX_YEAR_2025_26)).toBeCloseTo(4210.6, 2)
  })

  it('calculates correct NI for gross=125140', () => {
    // 8% * 37700 + 2% * (125140 - 50270) = 3016 + 1497.40 = 4513.40
    expect(calculateNI(125140, DEFAULT_TAX_YEAR_2025_26)).toBeCloseTo(4513.4, 2)
  })

  it('calculates correct NI for gross=150000', () => {
    // 8% * 37700 + 2% * (150000 - 50270) = 3016 + 1994.60 = 5010.60
    expect(calculateNI(150000, DEFAULT_TAX_YEAR_2025_26)).toBeCloseTo(5010.6, 2)
  })
})

describe('calculateTakeHome', () => {
  it('calculates correct take-home for gross=110000', () => {
    const result = calculateTakeHome(110000, DEFAULT_TAX_YEAR_2025_26)
    // PA = 7570, taxable = 102430
    // incomeTax = 37700*0.20 + 64730*0.40 = 7540 + 25892 = 33432
    // NI = 8% * 37700 + 2% * (110000 - 50270) = 3016 + 1194.60 = 4210.60
    expect(result.incomeTax).toBeCloseTo(33432, 2)
    expect(result.ni).toBeCloseTo(4210.6, 2)
    expect(result.takeHomeAnnual).toBeCloseTo(72357.4, 2)
    expect(result.takeHomeMonthly).toBeCloseTo(6029.78, 2)
  })
})

describe('calculateANI', () => {
  it('returns gross when no sacrifice', () => {
    expect(calculateANI(110000, 0, DEFAULT_TAX_YEAR_2025_26)).toBe(110000)
  })

  it('reduces ANI by sacrifice amount', () => {
    expect(calculateANI(110000, 11000, DEFAULT_TAX_YEAR_2025_26)).toBe(99000)
  })

  it('caps at 0 when sacrifice exceeds gross', () => {
    expect(calculateANI(110000, 60000, DEFAULT_TAX_YEAR_2025_26)).toBe(50000)
  })
})

describe('generateMarginalRateCurve', () => {
  it('generates correct number of points for default range', () => {
    const points = generateMarginalRateCurve(DEFAULT_TAX_YEAR_2025_26)
    // (150000 - 50000) / 500 + 1 = 201 points
    expect(points.length).toBe(201)
  })

  it('flags inTrap for incomes between 100000 and 125140', () => {
    const points = generateMarginalRateCurve(DEFAULT_TAX_YEAR_2025_26)
    const trapPoints = points.filter((p) => p.inTrap)
    expect(trapPoints.length).toBeGreaterThan(0)

    // First trap point should be at 100000
    const firstTrap = points.find((p) => p.income >= 100000 && p.inTrap)
    expect(firstTrap).toBeDefined()
    expect(firstTrap!.income).toBe(100000)

    // Last trap point should be just below 125140
    const lastTrap = points
      .filter((p) => p.inTrap)
      .pop()
    expect(lastTrap!.income).toBeLessThan(125140)
  })

  it('does not flag inTrap outside trap zone', () => {
    const points = generateMarginalRateCurve(DEFAULT_TAX_YEAR_2025_26)
    const lowPoints = points.filter((p) => p.income < 100000)
    expect(lowPoints.every((p) => !p.inTrap)).toBe(true)

    const highPoints = points.filter((p) => p.income >= 125140)
    expect(highPoints.every((p) => !p.inTrap)).toBe(true)
  })

  it('shows elevated marginal rate in trap zone (~62% with NI)', () => {
    const points = generateMarginalRateCurve(DEFAULT_TAX_YEAR_2025_26)
    const trapZone = points.find((p) => p.income === 100500)
    expect(trapZone).toBeDefined()
    // Marginal rate should be roughly 62% (60% income tax + 2% NI above UEL)
    expect(trapZone!.marginalRate).toBeGreaterThan(55)
    expect(trapZone!.marginalRate).toBeLessThan(70)
  })

  it('shows ~45% marginal rate at 150000 (plus NI)', () => {
    const points = generateMarginalRateCurve(DEFAULT_TAX_YEAR_2025_26)
    const point = points.find((p) => p.income === 150000)
    expect(point).toBeDefined()
    expect(point!.marginalRate).toBeGreaterThan(40)
    expect(point!.marginalRate).toBeLessThan(55)
  })
})

describe('calculateChildBenefitCharge', () => {
  it('returns 0 for ANI below threshold', () => {
    expect(calculateChildBenefitCharge(50000, 1, DEFAULT_TAX_YEAR_2025_26)).toBe(0)
    expect(calculateChildBenefitCharge(59999, 2, DEFAULT_TAX_YEAR_2025_26)).toBe(0)
  })

  it('returns 0 at exactly 60000', () => {
    expect(calculateChildBenefitCharge(60000, 1, DEFAULT_TAX_YEAR_2025_26)).toBe(0)
  })

  it('charges ~50% for 1 kid at ANI=70000', () => {
    // 1 kid = 26.05 * 52 = ~1354.60
    // 70000 is 10000 over 60000 = 50% clawback
    const charge = calculateChildBenefitCharge(70000, 1, DEFAULT_TAX_YEAR_2025_26)
    expect(charge).toBeCloseTo(677.30, 1)
  })

  it('charges full clawback for 1 kid at ANI=80000', () => {
    const charge = calculateChildBenefitCharge(80000, 1, DEFAULT_TAX_YEAR_2025_26)
    expect(charge).toBeCloseTo(1354.60, 1)
  })

  it('charges full clawback for 2 kids at ANI=100000', () => {
    // 2 kids = 26.05*52 + 17.25*52 = 1354.60 + 897 = 2251.60
    const charge = calculateChildBenefitCharge(100000, 2, DEFAULT_TAX_YEAR_2025_26)
    expect(charge).toBeCloseTo(2251.60, 1)
  })
})

describe('costOfOnePoundOver100k', () => {
  it('returns base 62% without childcare', () => {
    const result = costOfOnePoundOver100k(DEFAULT_TAX_YEAR_2025_26)
    expect(result.marginalRate).toBeCloseTo(0.62, 2)
    expect(result.description).toContain('60% tax trap')
    expect(result.description).toContain('2% NI')
    expect(result.description).toContain('62%')
  })

  it('adds childcare loss when provided', () => {
    const result = costOfOnePoundOver100k(DEFAULT_TAX_YEAR_2025_26, 5000)
    const trapZoneEnd = 100000 + DEFAULT_TAX_YEAR_2025_26.personalAllowance * 2
    // 5000 / (trapZoneEnd - 100000) ≈ 0.1989 per pound
    expect(result.marginalRate).toBeCloseTo(
      0.62 + 5000 / (trapZoneEnd - 100000),
      2,
    )
    expect(result.description).toContain('childcare')
  })
})
