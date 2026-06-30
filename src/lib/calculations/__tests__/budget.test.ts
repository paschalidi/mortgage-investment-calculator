import { describe, it, expect } from 'vitest'
import { calculateBudget } from '../budget'

describe('calculateBudget', () => {
  it('default inputs produce expected snapshot of remainingBudget', () => {
    const result = calculateBudget({
      myIncomeMonthly: 4000,
      partnerIncomeMonthly: 3500,
      myPersonalExpenses: 200,
      partnerPersonalExpenses: 200,
      myTherapy: 0,
      partnerTherapy: 0,
      expenses: {
        utilities: 250,
        groceries: 600,
        transport: 300,
        childcare: 800,
        homeInsurance: 50,
        holidays: 200,
        shopping: 300,
        entertainment: 150,
        other: 100,
        gym: 0,
        subscriptions: 0,
        diningOut: 0,
        coffee: 0,
        pets: 0,
        car: 0,
        phone: 0,
        internet: 0,
        clothing: 0,
        gifts: 0,
        charity: 0,
        homeMaintenance: 0,
      },
      mortgageMonthlyOutgoing: 2974.3904218141543,
      investmentPhase1Monthly: 1000,
      myPensionMonthly: 300,
      partnerPensionMonthly: 250,
    })

    // Captured snapshot values from legacy inline code (index.tsx lines 160-165)
    expect(result.totalIncome).toBe(7500)
    expect(result.personalTotal).toBe(950)
    expect(result.baseExpenses).toBe(2750)
    expect(result.totalExpenses).toBeCloseTo(7674.390421814154, 10)
    expect(result.remainingBudget).toBeCloseTo(-174.39042181415425, 10)
  })

  it('empty/zero expenses do not crash', () => {
    const result = calculateBudget({
      myIncomeMonthly: 5000,
      partnerIncomeMonthly: 0,
      myPersonalExpenses: 0,
      partnerPersonalExpenses: 0,
      myTherapy: 0,
      partnerTherapy: 0,
      expenses: {
        utilities: 0,
        groceries: 0,
        transport: 0,
        childcare: 0,
        homeInsurance: 0,
        holidays: 0,
        shopping: 0,
        entertainment: 0,
        other: 0,
        gym: 0,
        subscriptions: 0,
        diningOut: 0,
        coffee: 0,
        pets: 0,
        car: 0,
        phone: 0,
        internet: 0,
        clothing: 0,
        gifts: 0,
        charity: 0,
        homeMaintenance: 0,
      },
      mortgageMonthlyOutgoing: 0,
      investmentPhase1Monthly: 0,
      myPensionMonthly: 0,
      partnerPensionMonthly: 0,
    })

    expect(result.totalIncome).toBe(5000)
    expect(result.personalTotal).toBe(0)
    expect(result.baseExpenses).toBe(0)
    expect(result.totalExpenses).toBe(0)
    expect(result.remainingBudget).toBe(5000)
  })
})
