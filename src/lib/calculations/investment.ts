import type { InvestmentInputs, InvestmentResult, DividendResult, TaxYearConfig } from './types'
import { DEFAULT_TAX_YEAR_2025_26 } from './tax'

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

export function calculateDividendTax(
  annualDividendGross: number,
  otherIncomeNet: number = 0,
  config: TaxYearConfig = DEFAULT_TAX_YEAR_2025_26,
): DividendResult {
  // Step 1: PA available after salary consumes it (with taper on salary)
  const paAfterTaper = Math.max(
    0,
    config.personalAllowance - Math.max(0, (otherIncomeNet - 100000) / 2),
  )
  const paAvailableForDividends = Math.max(0, paAfterTaper - otherIncomeNet)

  // Step 2: Determine which band dividends fall in
  const basicBandWidth = config.basicRateLimit - config.personalAllowance
  const basicUsedBySalary = Math.max(
    0,
    Math.min(otherIncomeNet - paAfterTaper, basicBandWidth),
  )
  const basicRemainingForDividends = Math.max(0, basicBandWidth - basicUsedBySalary)

  const higherBandWidth = config.higherRateLimit - config.basicRateLimit
  const higherUsedBySalary = Math.max(
    0,
    Math.min(otherIncomeNet - config.basicRateLimit, higherBandWidth),
  )
  const higherRemainingForDividends = Math.max(0, higherBandWidth - higherUsedBySalary)

  // Step 3: Slice dividends through remaining bands
  let tax = 0
  let remaining = annualDividendGross

  // Dividend allowance first (£500)
  const allowancePortion = Math.min(remaining, config.dividendAllowance)
  remaining -= allowancePortion

  // Personal allowance for dividends (if any left after salary)
  const paPortion = Math.min(remaining, paAvailableForDividends)
  remaining -= paPortion

  // Basic rate portion
  const basicPortion = Math.min(remaining, basicRemainingForDividends)
  tax += basicPortion * config.dividendBasicRate
  remaining -= basicPortion

  // Higher rate portion
  const higherPortion = Math.min(remaining, higherRemainingForDividends)
  tax += higherPortion * config.dividendHigherRate
  remaining -= higherPortion

  // Additional rate (anything left)
  tax += remaining * config.dividendAdditionalRate

  const annualNet = annualDividendGross - tax
  return {
    annualGross: annualDividendGross,
    monthlyGross: annualDividendGross / 12,
    annualTax: tax,
    annualNet,
    monthlyNet: annualNet / 12,
    effectiveRate: annualDividendGross > 0 ? (tax / annualDividendGross) * 100 : 0,
  }
}
