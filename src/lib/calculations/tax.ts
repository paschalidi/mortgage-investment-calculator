import type { TaxBandBreakdown, TaxYearConfig, MarginalRatePoint } from './types'

export const DEFAULT_TAX_YEAR_2025_26: TaxYearConfig = {
  personalAllowance: 12570,
  basicRateLimit: 50270,
  higherRateLimit: 125140,
  additionalRateThreshold: 125140,
  basicRate: 0.20,
  higherRate: 0.40,
  additionalRate: 0.45,
  niPrimaryThreshold: 12570,
  niRate: 0.08,
  niUpperEarningsLimit: 50270,
  niUpperRate: 0.02,
  dividendAllowance: 500,
  dividendBasicRate: 0.0875,
  dividendHigherRate: 0.3375,
  dividendAdditionalRate: 0.3935,
  cgtAnnualExempt: 3000,
  cgtBasicRate: 0.18,
  cgtHigherRate: 0.24,
  isaAllowance: 20000,
  pensionAnnualAllowance: 60000,
  statePensionAmount: 11502,
  statePensionAge: 67,
  pensionAccessAge: 57,
  inflationRate: 0.025,
  swr: 0.035,
  lifeExpectancy: 95,
}

export function calculateIncomeTax(
  gross: number,
  config: TaxYearConfig,
): { tax: number; bands: TaxBandBreakdown[] } {
  const pa = calculatePersonalAllowance(gross, config)
  const taxableIncome = Math.max(0, gross - pa)

  const basicBandWidth = config.basicRateLimit - config.personalAllowance
  const higherBandWidth = config.higherRateLimit - pa - basicBandWidth

  const basicBand = Math.min(taxableIncome, basicBandWidth)
  const higherBand = Math.min(
    Math.max(0, taxableIncome - basicBand),
    higherBandWidth,
  )
  const additionalBand = Math.max(0, taxableIncome - basicBand - higherBand)

  const basicTax = basicBand * config.basicRate
  const higherTax = higherBand * config.higherRate
  const additionalTax = additionalBand * config.additionalRate

  const tax = basicTax + higherTax + additionalTax

  const bands: TaxBandBreakdown[] = [
    {
      name: 'Personal Allowance',
      taxable: pa,
      tax: 0,
      rate: 0,
    },
    {
      name: 'Basic',
      taxable: basicBand,
      tax: basicTax,
      rate: config.basicRate,
    },
    {
      name: 'Higher',
      taxable: higherBand,
      tax: higherTax,
      rate: config.higherRate,
    },
    {
      name: 'Additional',
      taxable: additionalBand,
      tax: additionalTax,
      rate: config.additionalRate,
    },
  ]

  return { tax, bands }
}

function calculatePersonalAllowance(
  gross: number,
  config: TaxYearConfig,
): number {
  if (gross <= 100000) {
    return config.personalAllowance
  }
  const taper = Math.max(0, (gross - 100000) / 2)
  return Math.max(0, config.personalAllowance - taper)
}

export function calculateNI(gross: number, config: TaxYearConfig): number {
  if (gross <= config.niPrimaryThreshold) return 0
  const mainNi =
    Math.min(
      gross - config.niPrimaryThreshold,
      config.niUpperEarningsLimit - config.niPrimaryThreshold,
    ) * config.niRate
  const upperNi = Math.max(0, gross - config.niUpperEarningsLimit) * config.niUpperRate
  return mainNi + upperNi
}

export function calculateTakeHome(
  gross: number,
  config: TaxYearConfig,
): {
  incomeTax: number
  ni: number
  takeHomeAnnual: number
  takeHomeMonthly: number
} {
  const incomeTax = calculateIncomeTax(gross, config).tax
  const ni = calculateNI(gross, config)
  const takeHomeAnnual = gross - incomeTax - ni
  const takeHomeMonthly = takeHomeAnnual / 12

  return { incomeTax, ni, takeHomeAnnual, takeHomeMonthly }
}

export function calculateANI(
  gross: number,
  pensionSacrifice: number,
  _config: TaxYearConfig,
): number {
  return Math.max(0, gross - pensionSacrifice)
}

export function generateMarginalRateCurve(
  config: TaxYearConfig,
  range: [number, number] = [50000, 150000],
  step: number = 500,
): MarginalRatePoint[] {
  const points: MarginalRatePoint[] = []
  const [start, end] = range

  const totalTaxAt = (income: number): number => {
    return (
      calculateIncomeTax(income, config).tax + calculateNI(income, config)
    )
  }

  for (let income = start; income <= end; income += step) {
    const taxNow = totalTaxAt(income)
    const taxNext = totalTaxAt(income + step)
    const marginalRate = ((taxNext - taxNow) / step) * 100
    const effectiveRate = income > 0 ? (taxNow / income) * 100 : 0
    const trapZoneEnd = 100000 + config.personalAllowance * 2
    const inTrap = income >= 100000 && income < trapZoneEnd

    points.push({ income, marginalRate, effectiveRate, inTrap })
  }

  return points
}

export function calculateChildBenefitCharge(
  ani: number,
  childrenCount: number,
  _config: TaxYearConfig,
): number {
  const eldestWeekly = 26.05
  const additionalWeekly = 17.25
  const weeksPerYear = 52

  const annualChildBenefit =
    eldestWeekly * weeksPerYear +
    (childrenCount - 1) * additionalWeekly * weeksPerYear

  if (ani < 60000) {
    return 0
  }
  if (ani >= 80000) {
    return annualChildBenefit
  }

  // 1% for every £200 over £60,000
  const excess = ani - 60000
  const percentage = Math.min(100, excess / 200)
  return (annualChildBenefit * percentage) / 100
}

export function costOfOnePoundOver100k(
  config: TaxYearConfig,
  childcareValueAnnual: number = 0,
): { marginalRate: number; description: string } {
  const incomeTaxRate = config.higherRate // 40%
  const paLossRate = config.higherRate / 2 // £1 PA lost per £2 earned = 20% effective
  const niRate = config.niUpperRate // 2% above UEL
  const baseMarginal = incomeTaxRate + paLossRate + niRate // 0.40 + 0.20 + 0.02 = 0.62

  const trapZoneEnd = 100000 + config.personalAllowance * 2
  const childcareLossPerPound =
    childcareValueAnnual / (trapZoneEnd - 100000) // roughly £0.50 per £1 if full childcare
  const totalMarginal = baseMarginal + childcareLossPerPound

  const trapPct = Math.round((incomeTaxRate + paLossRate) * 100)
  const niPct = Math.round(niRate * 100)
  const basePct = Math.round(baseMarginal * 100)

  let description = `${trapPct}% tax trap + ${niPct}% NI = ${basePct}% effective`
  if (childcareLossPerPound > 0) {
    description += ` + childcare ≈ ${(totalMarginal * 100).toFixed(0)}%`
  }

  return { marginalRate: totalMarginal, description }
}
