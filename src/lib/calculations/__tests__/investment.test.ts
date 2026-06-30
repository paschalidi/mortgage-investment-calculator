import { describe, it, expect } from 'vitest'
import { calculateInvestmentGrowth } from '../investment'

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
