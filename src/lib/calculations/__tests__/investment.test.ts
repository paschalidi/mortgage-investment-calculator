import { describe, it, expect } from 'vitest'
import { calculateInvestmentGrowth, calculateDividendTax } from '../investment'
import { DEFAULT_TAX_YEAR_2025_26 } from '../tax'

describe('calculateInvestmentGrowth', () => {
  it('default inputs produce expected snapshot values', () => {
    const result = calculateInvestmentGrowth({
      initial: 80000,
      annualReturnRate: 8,
      phase1Monthly: 1000,
      phase2Monthly: 3000,
      termYears: 20,
      monthsToPayoffMortgage: 216,
    })

    // Captured snapshot values from legacy inline code (index.tsx lines 100-117)
    expect(result.finalBalance).toBeCloseTo(1035031.0168098427, 10)
    expect(result.totalContributed).toBe(368000)
    expect(result.totalInterest).toBeCloseTo(667031.0168098429, 10)
  })

  it('phase 2 kicks in correctly when month > monthsToPayoff', () => {
    const resultWithPhase2 = calculateInvestmentGrowth({
      initial: 0,
      annualReturnRate: 0,
      phase1Monthly: 100,
      phase2Monthly: 500,
      termYears: 2,
      monthsToPayoffMortgage: 6,
    })

    // 6 months of phase 1 (100) + 18 months of phase 2 (500) = 600 + 9000 = 9600
    expect(resultWithPhase2.totalContributed).toBe(9600)
    expect(resultWithPhase2.finalBalance).toBe(9600)

    const resultNoPhase2 = calculateInvestmentGrowth({
      initial: 0,
      annualReturnRate: 0,
      phase1Monthly: 100,
      phase2Monthly: 500,
      termYears: 2,
      monthsToPayoffMortgage: -1,
    })

    // Mortgage never paid off, so all 24 months are phase 1
    expect(resultNoPhase2.totalContributed).toBe(2400)
    expect(resultNoPhase2.finalBalance).toBe(2400)
  })
})

describe('calculateDividendTax', () => {
  it('no other income — uses personal allowance against dividends', () => {
    const result = calculateDividendTax(20000, 0, DEFAULT_TAX_YEAR_2025_26)
    // £12,570 PA + £500 allowance = £13,070 tax-free
    // Remaining £6,930 at 8.75% = £606.375
    expect(result.annualTax).toBeCloseTo(606.38, 2)
    expect(result.annualNet).toBeCloseTo(19393.625, 3)
    expect(result.effectiveRate).toBeCloseTo(3.03, 2)
  })

  it('£20k dividends on top of £99k salary — PA consumed by salary', () => {
    const result = calculateDividendTax(20000, 99000, DEFAULT_TAX_YEAR_2025_26)
    // PA consumed by salary → 0 left for dividends
    // £500 dividend allowance at 0%
    // £19,500 remaining, all in higher rate band (since £99k + £19.5k = £118.5k < £125,140)
    // Tax = 19500 * 0.3375 = £6,581.25
    expect(result.annualTax).toBeCloseTo(6581.25, 2)
    expect(result.annualNet).toBeCloseTo(13418.75, 2)
    expect(result.effectiveRate).toBeCloseTo(32.91, 2)
  })

  it('£50k dividends on top of £99k salary — spans higher and additional bands', () => {
    const result = calculateDividendTax(50000, 99000, DEFAULT_TAX_YEAR_2025_26)
    // £500 allowance
    // Basic remaining = £37,700 - (£99,000 - £12,570) = negative → 0
    // So all £49,500 at higher rate (until £125,140 total)
    // £125,140 - £99,000 = £26,140 in higher band → tax = 26,140 * 0.3375 = £8,822.25
    // Remaining £49,500 - £26,140 = £23,360 at additional rate → tax = 23,360 * 0.3935 = £9,192.16
    // Total tax = £8,822.25 + £9,192.16 = £18,014.41
    expect(result.annualTax).toBeCloseTo(18014.41, 2)
    expect(result.annualNet).toBeCloseTo(31985.59, 2)
    expect(result.effectiveRate).toBeCloseTo(36.03, 2)
  })

  it('small dividend with high salary — allowance only', () => {
    const result = calculateDividendTax(300, 120000, DEFAULT_TAX_YEAR_2025_26)
    // £300 all within £500 allowance → zero tax
    expect(result.annualTax).toBe(0)
    expect(result.annualNet).toBe(300)
    expect(result.effectiveRate).toBe(0)
  })
})
