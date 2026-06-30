import type { BudgetInputs, BudgetResult } from './types'

export function calculateBudget(inputs: BudgetInputs): BudgetResult {
  const {
    myIncomeMonthly,
    partnerIncomeMonthly,
    myPersonalExpenses,
    partnerPersonalExpenses,
    myTherapy,
    partnerTherapy,
    expenses,
    mortgageMonthlyOutgoing,
    investmentPhase1Monthly,
    myPensionMonthly,
    partnerPensionMonthly,
  } = inputs

  const totalIncome = myIncomeMonthly + partnerIncomeMonthly
  const personalTotal =
    (myPersonalExpenses || 0) +
    (partnerPersonalExpenses || 0) +
    (myPensionMonthly || 0) +
    (partnerPensionMonthly || 0) +
    (myTherapy || 0) +
    (partnerTherapy || 0)

  const baseExpenses = Object.values(expenses).reduce(
    (acc, val) => acc + (val || 0),
    0,
  )

  const totalExpenses =
    personalTotal + baseExpenses + mortgageMonthlyOutgoing + investmentPhase1Monthly
  const remainingBudget = totalIncome - totalExpenses

  return {
    totalIncome,
    personalTotal,
    baseExpenses,
    totalExpenses,
    remainingBudget,
  }
}
