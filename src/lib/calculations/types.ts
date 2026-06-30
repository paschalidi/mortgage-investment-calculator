export type TaxBand = {
  threshold: number
  rate: number
}

export type TaxBandBreakdown = {
  name: string
  taxable: number
  tax: number
  rate: number
}

export type TaxYearConfig = {
  personalAllowance: number
  basicRateLimit: number
  higherRateLimit: number
  additionalRateThreshold: number
  basicRate: number
  higherRate: number
  additionalRate: number
  niPrimaryThreshold: number
  niRate: number
  dividendAllowance: number
  dividendBasicRate: number
  dividendHigherRate: number
  dividendAdditionalRate: number
  cgtAnnualExempt: number
  cgtBasicRate: number
  cgtHigherRate: number
  isaAllowance: number
  pensionAnnualAllowance: number
  statePensionAmount: number
  statePensionAge: number
  pensionAccessAge: number
  inflationRate: number
  swr: number
  lifeExpectancy: number
}

export type MortgageInputs = {
  principal: number
  annualRate: number
  years: number
  monthlyOverpayment: number
}

export type MortgageResult = {
  standardMonthlyPayment: number
  totalMonthlyPayment: number
  monthsToPayoff: number
  totalInterestWithOverpayment: number
  totalPaidWithOverpayment: number
  standardTotalInterest: number
  standardTotalPaid: number
  interestSaved: number
  yearsSaved: number
}

export type InvestmentInputs = {
  initial: number
  annualReturnRate: number
  phase1Monthly: number
  phase2Monthly: number
  termYears: number
  monthsToPayoffMortgage: number
}

export type InvestmentResult = {
  finalBalance: number
  totalContributed: number
  totalInterest: number
}

export type DividendResult = {
  annualGross: number
  monthlyGross: number
  annualTax: number
  annualNet: number
  monthlyNet: number
  effectiveRate: number
}

export interface BudgetExpenses {
  utilities: number
  groceries: number
  transport: number
  childcare: number
  homeInsurance: number
  holidays: number
  shopping: number
  entertainment: number
  other: number
  gym: number
  subscriptions: number
  diningOut: number
  coffee: number
  pets: number
  car: number
  phone: number
  internet: number
  clothing: number
  gifts: number
  charity: number
  homeMaintenance: number
}

export type BudgetInputs = {
  myIncomeMonthly: number
  partnerIncomeMonthly: number
  myPersonalExpenses: number
  partnerPersonalExpenses: number
  myTherapy: number
  partnerTherapy: number
  expenses: Record<string, number>
  mortgageMonthlyOutgoing: number
  investmentPhase1Monthly: number
  myPensionMonthly: number
  partnerPensionMonthly: number
}

export type BudgetResult = {
  totalIncome: number
  personalTotal: number
  baseExpenses: number
  totalExpenses: number
  remainingBudget: number
}
