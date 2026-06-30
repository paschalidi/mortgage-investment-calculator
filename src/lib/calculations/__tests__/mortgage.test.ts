import { describe, it, expect } from 'vitest'
import { calculateMortgage } from '../mortgage'

describe('calculateMortgage', () => {
  it('default inputs produce expected snapshot values', () => {
    const result = calculateMortgage({
      principal: 461000,
      annualRate: 3.9,
      years: 30,
      monthlyOverpayment: 800,
    })

    // Captured snapshot values from legacy inline code (index.tsx lines 54-98)
    expect(result.standardMonthlyPayment).toBeCloseTo(2174.3904218141543, 10)
    expect(result.totalMonthlyPayment).toBeCloseTo(2974.3904218141543, 10)
    expect(result.monthsToPayoff).toBe(216)
    expect(result.totalInterestWithOverpayment).toBeCloseTo(181236.33932084724, 10)
    expect(result.totalPaidWithOverpayment).toBeCloseTo(642236.3393208497, 10)
    expect(result.standardTotalInterest).toBeCloseTo(321780.55185309553, 10)
    expect(result.standardTotalPaid).toBeCloseTo(782780.5518530955, 10)
    expect(result.interestSaved).toBeCloseTo(140544.2125322483, 10)
    expect(result.yearsSaved).toBeCloseTo(12, 10)
  })

  it('payment not covering interest returns monthsToPayoff === -1', () => {
    // Standard amortization always covers interest, so we simulate by making the
    // total monthly payment less than the first-month interest via a negative overpayment.
    const result = calculateMortgage({
      principal: 500000,
      annualRate: 10,
      years: 30,
      monthlyOverpayment: -4000, // makes total payment < interest
    })

    expect(result.monthsToPayoff).toBe(-1)
  })

  it('0% interest produces straight-line payoff', () => {
    const result = calculateMortgage({
      principal: 120000,
      annualRate: 0,
      years: 10,
      monthlyOverpayment: 0,
    })

    // Standard payment = principal / months = 120000 / 120 = 1000
    expect(result.standardMonthlyPayment).toBe(1000)
    expect(result.monthsToPayoff).toBe(120)
    expect(result.totalInterestWithOverpayment).toBe(0)
    expect(result.totalPaidWithOverpayment).toBe(120000)
  })
})
