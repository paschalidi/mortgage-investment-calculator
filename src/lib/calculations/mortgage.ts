import type { MortgageInputs, MortgageResult } from './types'

export function calculateMortgage(inputs: MortgageInputs): MortgageResult {
  const { principal, annualRate, years, monthlyOverpayment } = inputs

  // Monthly interest rate
  const r_m = annualRate / 100 / 12
  // Total number of payments
  const n = years * 12

  // Standard monthly payment (M = P [ i(1 + i)^n ] / [ (1 + i)^n - 1])
  const standardMonthlyPayment =
    r_m > 0
      ? (principal * (r_m * Math.pow(1 + r_m, n))) / (Math.pow(1 + r_m, n) - 1)
      : principal / (n || 1)

  const totalMonthlyPayment = standardMonthlyPayment + monthlyOverpayment

  // Calculate payoff time and total interest with overpayment
  let remainingBalance = principal
  let monthsToPayoff = 0
  let totalInterestWithOverpayment = 0
  let totalPaidWithOverpayment = 0

  while (remainingBalance > 0 && monthsToPayoff < 1200) {
    // cap at 100 years
    const interestForMonth = remainingBalance * r_m
    totalInterestWithOverpayment += interestForMonth

    let principalPayment = totalMonthlyPayment - interestForMonth

    // If payment doesn't cover interest, loan will never be paid off
    if (principalPayment <= 0) {
      monthsToPayoff = -1
      break
    }

    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance
      totalPaidWithOverpayment += remainingBalance + interestForMonth
    } else {
      totalPaidWithOverpayment += totalMonthlyPayment
    }

    remainingBalance -= principalPayment
    monthsToPayoff++
  }

  const standardTotalInterest = standardMonthlyPayment * n - principal
  const standardTotalPaid = standardMonthlyPayment * n

  const interestSaved = standardTotalInterest - totalInterestWithOverpayment
  const yearsSaved = years - monthsToPayoff / 12

  return {
    standardMonthlyPayment,
    totalMonthlyPayment,
    monthsToPayoff,
    totalInterestWithOverpayment,
    totalPaidWithOverpayment,
    standardTotalInterest,
    standardTotalPaid,
    interestSaved,
    yearsSaved,
  }
}
