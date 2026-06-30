import type { InvestmentInputs, InvestmentResult, DividendResult } from './types'

export function calculateInvestmentGrowth(inputs: InvestmentInputs): InvestmentResult {
  const {
    initial,
    annualReturnRate,
    phase1Monthly,
    phase2Monthly,
    termYears,
    monthsToPayoffMortgage,
  } = inputs

  const r_im = annualReturnRate / 100 / 12
  const totalInvMonths = termYears * 12

  let finalBalance = initial
  let totalContributed = initial
  let totalInterest = 0

  for (let month = 1; month <= totalInvMonths; month++) {
    const isMortgagePaidOff = monthsToPayoffMortgage !== -1 && month > monthsToPayoffMortgage
    const C = isMortgagePaidOff ? phase2Monthly : phase1Monthly

    const I = finalBalance * r_im

    totalInterest += I
    totalContributed += C
    finalBalance += I + C
  }

  return {
    finalBalance,
    totalContributed,
    totalInterest,
  }
}

export function calculateDividendTax(annualDividendGross: number): DividendResult {
  const personalAllowance = 12570
  const dividendAllowance = 500
  const basicRateLimit = 50270
  const higherRateLimit = 125140

  let taxable = annualDividendGross
  // Personal allowance absorbs first £12,570
  taxable = Math.max(0, taxable - personalAllowance)
  // Dividend allowance absorbs next £500
  taxable = Math.max(0, taxable - dividendAllowance)

  let tax = 0
  // Basic rate band: from 0 up to (basicRateLimit - personalAllowance - dividendAllowance)
  const basicBand = basicRateLimit - personalAllowance - dividendAllowance
  const higherBand = higherRateLimit - basicRateLimit

  if (taxable <= basicBand) {
    tax = taxable * 0.0875
  } else if (taxable <= basicBand + higherBand) {
    tax = basicBand * 0.0875 + (taxable - basicBand) * 0.3375
  } else {
    tax =
      basicBand * 0.0875 +
      higherBand * 0.3375 +
      (taxable - basicBand - higherBand) * 0.3935
  }

  const annualTax = tax
  const annualNet = annualDividendGross - annualTax
  const monthlyGross = annualDividendGross / 12
  const monthlyNet = annualNet / 12
  const effectiveRate = annualDividendGross > 0 ? annualTax / annualDividendGross : 0

  return {
    annualGross: annualDividendGross,
    monthlyGross,
    annualTax,
    annualNet,
    monthlyNet,
    effectiveRate,
  }
}
