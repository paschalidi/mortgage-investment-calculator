import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  // Personal Details
  const [myDob, setMyDob] = useLocalStorage<string>('myDob', '1990-01-01')
  const [partnerDob, setPartnerDob] = useLocalStorage<string>('partnerDob', '1992-06-15')

  // Budget State
  const [myIncome, setMyIncome] = useLocalStorage<number>('myIncome', 4000)
  const [partnerIncome, setPartnerIncome] = useLocalStorage<number>('partnerIncome', 3500)
  
  // Personal Expenses
  const [myPersonalExpenses, setMyPersonalExpenses] = useLocalStorage<number>('myPersonalExpenses', 200)
  const [partnerPersonalExpenses, setPartnerPersonalExpenses] = useLocalStorage<number>('partnerPersonalExpenses', 200)
  const [myPension, setMyPension] = useLocalStorage<number>('myPension', 300)
  const [partnerPension, setPartnerPension] = useLocalStorage<number>('partnerPension', 250)
  const [myTherapy, setMyTherapy] = useLocalStorage<number>('myTherapy', 0)
  const [partnerTherapy, setPartnerTherapy] = useLocalStorage<number>('partnerTherapy', 0)

  const [expenses, setExpenses] = useLocalStorage('expenses', {
    utilities: 250,
    groceries: 600,
    transport: 300,
    childcare: 800,
    homeInsurance: 50,
    holidays: 200,
    shopping: 300,
    entertainment: 150,
    other: 100,
  })

  // Mortgage State
  const [principal, setPrincipal] = useLocalStorage<number>('principal', 461000)
  const [interestRate, setInterestRate] = useLocalStorage<number>('interestRate', 3.90)
  const [years, setYears] = useLocalStorage<number>('years', 30)
  const [overpayment, setOverpayment] = useLocalStorage<number>('overpayment', 800)

  // Investment State
  const [invInitial, setInvInitial] = useLocalStorage<number>('invInitial', 80000)
  const [invReturnRate, setInvReturnRate] = useLocalStorage<number>('invReturnRate', 8.00)
  const [invPhase1Contrib, setInvPhase1Contrib] = useLocalStorage<number>('invPhase1Contrib', 1000)
  const [invPhase2Contrib, setInvPhase2Contrib] = useLocalStorage<number>('invPhase2Contrib', 3000)
  const [invTermYears, setInvTermYears] = useLocalStorage<number>('invTermYears', 20)
  const [dividendYield, setDividendYield] = useLocalStorage<number>('dividendYield', 4.0)

  // --- Mortgage Calculations ---
  // Monthly interest rate
  const r_m = interestRate / 100 / 12
  // Total number of payments
  const n = years * 12

  // Standard monthly payment (M = P [ i(1 + i)^n ] / [ (1 + i)^n - 1])
  const standardMonthlyPayment = r_m > 0 ? principal * (r_m * Math.pow(1 + r_m, n)) / (Math.pow(1 + r_m, n) - 1) : principal / (n || 1)

  const totalMonthlyPayment = standardMonthlyPayment + overpayment;

  // Calculate payoff time and total interest with overpayment
  let remainingBalance = principal
  let monthsToPayoff = 0
  let totalInterestWithOverpayment = 0
  let totalPaidWithOverpayment = 0

  while (remainingBalance > 0 && monthsToPayoff < 1200) { // cap at 100 years
    const interestForMonth = remainingBalance * r_m
    totalInterestWithOverpayment += interestForMonth

    let principalPayment = totalMonthlyPayment - interestForMonth

    // If payment doesn't cover interest, loan will never be paid off
    if (principalPayment <= 0) {
      monthsToPayoff = -1;
      break;
    }

    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance
      totalPaidWithOverpayment += (remainingBalance + interestForMonth)
    } else {
      totalPaidWithOverpayment += totalMonthlyPayment
    }

    remainingBalance -= principalPayment
    monthsToPayoff++
  }

  const standardTotalInterest = (standardMonthlyPayment * n) - principal
  const standardTotalPaid = standardMonthlyPayment * n

  const interestSaved = standardTotalInterest - totalInterestWithOverpayment
  const yearsSaved = years - (monthsToPayoff / 12)

  // --- Investment Calculations ---
  const r_im = invReturnRate / 100 / 12
  const totalInvMonths = invTermYears * 12

  let invBalance = invInitial
  let invTotalContributed = invInitial
  let invTotalInterest = 0

  for (let month = 1; month <= totalInvMonths; month++) {
    const isMortgagePaidOff = monthsToPayoff !== -1 && month > monthsToPayoff;
    const C = isMortgagePaidOff ? invPhase2Contrib : invPhase1Contrib;

    const I = invBalance * r_im;

    invTotalInterest += I;
    invTotalContributed += C;
    invBalance += I + C;
  }

  // --- Dividend & UK Tax Calculations ---
  const annualDividendGross = invBalance * (dividendYield / 100);
  const monthlyDividendGross = annualDividendGross / 12;

  // UK tax on dividends assuming NO other income (2024/25 rates)
  // Personal Allowance: £12,570 (covers dividends if no other income)
  // Dividend Allowance: £500 (on top of personal allowance)
  // Basic rate band: £12,571 – £50,270 → 8.75%
  // Higher rate band: £50,271 – £125,140 → 33.75%
  // Additional rate: £125,141+ → 39.35%
  const calculateDividendTax = (annual: number) => {
    const personalAllowance = 12570;
    const dividendAllowance = 500;
    const basicRateLimit = 50270;
    const higherRateLimit = 125140;

    let taxable = annual;
    // Personal allowance absorbs first £12,570
    taxable = Math.max(0, taxable - personalAllowance);
    // Dividend allowance absorbs next £500
    taxable = Math.max(0, taxable - dividendAllowance);

    let tax = 0;
    // Basic rate band: from 0 up to (basicRateLimit - personalAllowance - dividendAllowance)
    const basicBand = basicRateLimit - personalAllowance - dividendAllowance;
    const higherBand = higherRateLimit - basicRateLimit;

    if (taxable <= basicBand) {
      tax = taxable * 0.0875;
    } else if (taxable <= basicBand + higherBand) {
      tax = basicBand * 0.0875 + (taxable - basicBand) * 0.3375;
    } else {
      tax = basicBand * 0.0875 + higherBand * 0.3375 + (taxable - basicBand - higherBand) * 0.3935;
    }
    return tax;
  };

  const annualDividendTax = calculateDividendTax(annualDividendGross);
  const annualDividendNet = annualDividendGross - annualDividendTax;
  const monthlyDividendNet = annualDividendNet / 12;

  // --- Budget Calculations ---
  const totalIncome = myIncome + partnerIncome;
  const personalTotal = (myPersonalExpenses || 0) + (partnerPersonalExpenses || 0) + (myPension || 0) + (partnerPension || 0) + (myTherapy || 0) + (partnerTherapy || 0);
  const baseExpenses = Object.values(expenses).reduce((acc, val) => acc + (val || 0), 0);
  const totalExpenses = personalTotal + baseExpenses + totalMonthlyPayment + invPhase1Contrib;
  const remainingBudget = totalIncome - totalExpenses;

  // --- Age Calculations ---
  const calculateAgeAtEnd = (dobString: string, monthsToAdd: number) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsToAdd);
    
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const myEndAge = calculateAgeAtEnd(myDob, totalInvMonths);
  const partnerEndAge = calculateAgeAtEnd(partnerDob, totalInvMonths);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
  }

  const handleExpenseChange = (key: keyof typeof expenses, value: string) => {
    setExpenses(prev => ({ ...prev, [key]: Number(value) }));
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 mt-4 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Modeler</h1>
        <p className="text-muted-foreground">Plan your budget, mortgage amortization, and see how overpayments and investments affect your financial future.</p>
      </div>

      {/* Budget Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Part 1: Monthly Budget</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Income & Expenses</CardTitle>
              <CardDescription>Enter your household monthly income and expenses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Income</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="myIncome">My Income (£)</Label>
                    <Input 
                      id="myIncome" 
                      type="number" 
                      value={myIncome === 0 ? '' : myIncome} 
                      onChange={(e) => setMyIncome(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partnerIncome">Partner's Income (£)</Label>
                    <Input 
                      id="partnerIncome" 
                      type="number" 
                      value={partnerIncome === 0 ? '' : partnerIncome} 
                      onChange={(e) => setPartnerIncome(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Personal Expenses</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="myPersonalExpenses">My Personal Spending (£)</Label>
                    <Input id="myPersonalExpenses" type="number" value={myPersonalExpenses === 0 ? '' : myPersonalExpenses} onChange={(e) => setMyPersonalExpenses(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partnerPersonalExpenses">Partner's Personal Spending (£)</Label>
                    <Input id="partnerPersonalExpenses" type="number" value={partnerPersonalExpenses === 0 ? '' : partnerPersonalExpenses} onChange={(e) => setPartnerPersonalExpenses(Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="myTherapy">My Therapy (£)</Label>
                    <Input id="myTherapy" type="number" value={myTherapy === 0 ? '' : myTherapy} onChange={(e) => setMyTherapy(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partnerTherapy">Partner's Therapy (£)</Label>
                    <Input id="partnerTherapy" type="number" value={partnerTherapy === 0 ? '' : partnerTherapy} onChange={(e) => setPartnerTherapy(Number(e.target.value))} />
                  </div>
                </div>

              </div>

              <div className="space-y-4 pt-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Pensions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="myPension">My Pension Contribution (£)</Label>
                    <Input id="myPension" type="number" value={myPension === 0 ? '' : myPension} onChange={(e) => setMyPension(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partnerPension">Partner's Pension Contribution (£)</Label>
                    <Input id="partnerPension" type="number" value={partnerPension === 0 ? '' : partnerPension} onChange={(e) => setPartnerPension(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Living Expenses</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="utilities">Utilities & Bills (£)</Label>
                    <Input id="utilities" type="number" value={expenses.utilities === 0 ? '' : expenses.utilities} onChange={(e) => handleExpenseChange('utilities', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groceries">Groceries (£)</Label>
                    <Input id="groceries" type="number" value={expenses.groceries === 0 ? '' : expenses.groceries} onChange={(e) => handleExpenseChange('groceries', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transport">Transport (£)</Label>
                    <Input id="transport" type="number" value={expenses.transport === 0 ? '' : expenses.transport} onChange={(e) => handleExpenseChange('transport', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="childcare">Childcare (£)</Label>
                    <Input id="childcare" type="number" value={expenses.childcare === 0 ? '' : expenses.childcare} onChange={(e) => handleExpenseChange('childcare', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeInsurance">Home Insurance (£)</Label>
                    <Input id="homeInsurance" type="number" value={expenses.homeInsurance === 0 ? '' : expenses.homeInsurance} onChange={(e) => handleExpenseChange('homeInsurance', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="holidays">Holidays Savings (£)</Label>
                    <Input id="holidays" type="number" value={expenses.holidays === 0 ? '' : expenses.holidays} onChange={(e) => handleExpenseChange('holidays', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopping">Shopping (£)</Label>
                    <Input id="shopping" type="number" value={expenses.shopping === 0 ? '' : expenses.shopping} onChange={(e) => handleExpenseChange('shopping', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entertainment">Entertainment (£)</Label>
                    <Input id="entertainment" type="number" value={expenses.entertainment === 0 ? '' : expenses.entertainment} onChange={(e) => handleExpenseChange('entertainment', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other">Other (£)</Label>
                    <Input id="other" type="number" value={expenses.other === 0 ? '' : expenses.other} onChange={(e) => handleExpenseChange('other', e.target.value)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 dark:bg-slate-900 border-primary/20">
            <CardHeader>
              <CardTitle>Budget Summary</CardTitle>
              <CardDescription>Monthly cash flow including mortgage and investments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div className="font-medium text-muted-foreground">Total Income</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">+{formatCurrency(totalIncome)}</div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Personal Expenses</span>
                  <span className="font-medium">{formatCurrency((myPersonalExpenses || 0) + (partnerPersonalExpenses || 0))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Pensions</span>
                  <span className="font-medium">{formatCurrency((myPension || 0) + (partnerPension || 0))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Therapy</span>
                  <span className="font-medium">{formatCurrency((myTherapy || 0) + (partnerTherapy || 0))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Living Expenses</span>
                  <span className="font-medium">{formatCurrency(baseExpenses)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Mortgage Payment (inc. overpayment)</span>
                  <span className="font-medium">{formatCurrency(totalMonthlyPayment)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Investment Contribution (Phase 1)</span>
                  <span className="font-medium">{formatCurrency(invPhase1Contrib)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-t mt-2">
                  <div className="font-medium text-muted-foreground">Total Outgoings</div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">-{formatCurrency(totalExpenses)}</div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${remainingBudget >= 0 ? 'bg-green-100/50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-red-100/50 border-red-200 dark:bg-red-950/20 dark:border-red-900'}`}>
                <div className="text-sm font-medium mb-1">Remaining Budget</div>
                <div className={`text-3xl font-bold ${remainingBudget >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {formatCurrency(remainingBudget)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {remainingBudget >= 0 ? 'You have a surplus each month.' : 'Warning: Your expenses exceed your income.'}
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mortgage Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Part 2: Mortgage Amortization</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mortgage Details</CardTitle>
              <CardDescription>Enter your loan variables to see the amortization schedule summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="principal">Loan Amount (£)</Label>
                <Input
                  id="principal"
                  type="number"
                  value={principal || ''}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest">Annual Interest Rate (%)</Label>
                <Input
                  id="interest"
                  type="number"
                  step="0.1"
                  value={interestRate || ''}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years">Original Term (Years)</Label>
                <Input
                  id="years"
                  type="number"
                  value={years || ''}
                  onChange={(e) => setYears(Number(e.target.value))}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                <Label className="text-muted-foreground">Standard Monthly Payment</Label>
                <div className="text-2xl font-bold">{formatCurrency(standardMonthlyPayment)}</div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="overpayment">Monthly Overpayment (£)</Label>
                  <Input
                    id="overpayment"
                    type="number"
                    value={overpayment === 0 ? '' : overpayment}
                    onChange={(e) => setOverpayment(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPayment">Total Monthly Payment (£)</Label>
                  <Input
                    id="totalPayment"
                    type="number"
                    value={Math.round(totalMonthlyPayment * 100) / 100 || ''}
                    onChange={(e) => {
                      const newTotal = Number(e.target.value);
                      setOverpayment(Math.max(0, newTotal - standardMonthlyPayment));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Changing this will automatically adjust the overpayment amount.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 dark:bg-slate-900 border-primary/20">
            <CardHeader>
              <CardTitle>Amortization Summary</CardTitle>
              <CardDescription>How your payments break down over time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Standard Term</div>
                  <div className="text-xl font-semibold">{years} years</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">New Term</div>
                  <div className="text-xl font-semibold text-primary">
                    {monthsToPayoff > 0 ? `${Math.floor(monthsToPayoff / 12)}y ${monthsToPayoff % 12}m` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Standard Interest Paid</div>
                  <div className="text-xl font-semibold">{formatCurrency(standardTotalInterest)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">New Interest Paid</div>
                  <div className="text-xl font-semibold text-primary">{formatCurrency(totalInterestWithOverpayment)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Standard Total Paid</div>
                  <div className="text-xl font-semibold">{formatCurrency(standardTotalPaid)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">New Total Paid</div>
                  <div className="text-xl font-semibold text-primary">{formatCurrency(totalPaidWithOverpayment)}</div>
                </div>
              </div>

              {overpayment > 0 && monthsToPayoff > 0 && (
                <div className="pt-4 border-t space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">Savings</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
                      <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Interest Saved</div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {formatCurrency(interestSaved)}
                      </div>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
                      <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Time Saved</div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {yearsSaved > 0 ? `${Math.floor(yearsSaved)}y ${Math.round((yearsSaved % 1) * 12)}m` : '0 months'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {monthsToPayoff === -1 && (
                <div className="pt-4 border-t text-destructive">
                  With these settings, the loan will never be paid off because the monthly payment does not cover the interest.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Investment Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Part 3: Investment Growth</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
              <CardDescription>Simulate the growth of a separate investment portfolio alongside your mortgage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="myDob">My Date of Birth</Label>
                    <Input 
                      id="myDob" 
                      type="date" 
                      value={myDob} 
                      onChange={(e) => setMyDob(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partnerDob">Partner's Date of Birth</Label>
                    <Input 
                      id="partnerDob" 
                      type="date" 
                      value={partnerDob} 
                      onChange={(e) => setPartnerDob(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="invInitial">Initial Investment (£)</Label>
                  <Input
                    id="invInitial"
                    type="number"
                    value={invInitial || ''}
                    onChange={(e) => setInvInitial(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invReturnRate">Annual Return Rate (%)</Label>
                  <Input
                    id="invReturnRate"
                    type="number"
                    step="0.1"
                    value={invReturnRate || ''}
                    onChange={(e) => setInvReturnRate(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invTermYears">Total Investment Term (Years)</Label>
                  <Input
                    id="invTermYears"
                    type="number"
                    value={invTermYears || ''}
                    onChange={(e) => setInvTermYears(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="dividendYield">Dividend Yield (%)</Label>
                  <Input
                    id="dividendYield"
                    type="number"
                    step="0.1"
                    value={dividendYield || ''}
                    onChange={(e) => setDividendYield(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Used to estimate retirement dividend income from the final portfolio.</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="invPhase1Contrib">Monthly Contribution (While paying mortgage) (£)</Label>
                  <Input
                    id="invPhase1Contrib"
                    type="number"
                    value={invPhase1Contrib === 0 ? '' : invPhase1Contrib}
                    onChange={(e) => setInvPhase1Contrib(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Phase 1 continues until month {monthsToPayoff > 0 ? monthsToPayoff : '-'}. This is factored into your monthly budget.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invPhase2Contrib">Monthly Contribution (After mortgage paid off) (£)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="invPhase2Contrib"
                      type="number"
                      value={invPhase2Contrib === 0 ? '' : invPhase2Contrib}
                      onChange={(e) => setInvPhase2Contrib(Number(e.target.value))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Phase 2 starts at month {monthsToPayoff > 0 ? monthsToPayoff + 1 : '-'}.
                    <br/>
                    <button
                      onClick={() => setInvPhase2Contrib(Math.round(invPhase1Contrib + totalMonthlyPayment))}
                      className="text-primary hover:underline mt-1"
                    >
                      Set to Phase 1 + Total Mortgage Payment (£{Math.round(invPhase1Contrib + totalMonthlyPayment)})
                    </button>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 dark:bg-slate-900 border-primary/20">
            <CardHeader>
              <CardTitle>Investment Summary</CardTitle>
              <CardDescription>How your portfolio grows over time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="grid grid-cols-1 gap-6">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-sm font-medium text-primary mb-1">Final Portfolio Value</div>
                  <div className="text-4xl font-bold text-primary">{formatCurrency(invBalance)}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Contributed</div>
                    <div className="text-xl font-semibold">{formatCurrency(invTotalContributed)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Includes initial £{formatCurrency(invInitial)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Interest Earned</div>
                    <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                      +{formatCurrency(invTotalInterest)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Phase 1 Duration</div>
                    <div className="text-lg">
                      {monthsToPayoff > 0 ? `${Math.floor(Math.min(monthsToPayoff, totalInvMonths) / 12)}y ${Math.min(monthsToPayoff, totalInvMonths) % 12}m` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Phase 2 Duration</div>
                    <div className="text-lg">
                      {monthsToPayoff > 0 && totalInvMonths > monthsToPayoff
                        ? `${Math.floor((totalInvMonths - monthsToPayoff) / 12)}y ${(totalInvMonths - monthsToPayoff) % 12}m`
                        : '0y 0m'}
                    </div>
                  </div>
                  
                  <div className="col-span-2 pt-2 border-t mt-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Age at End of Term</div>
                    <div className="flex gap-6">
                      {myEndAge !== null && !isNaN(myEndAge) && (
                        <div>
                          <span className="text-muted-foreground text-sm mr-2">Me:</span>
                          <span className="text-xl font-semibold">{myEndAge}</span>
                        </div>
                      )}
                      {partnerEndAge !== null && !isNaN(partnerEndAge) && (
                        <div>
                          <span className="text-muted-foreground text-sm mr-2">Partner:</span>
                          <span className="text-xl font-semibold">{partnerEndAge}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {monthsToPayoff === -1 && (
                <div className="pt-4 border-t text-destructive text-sm">
                  Since the mortgage is never paid off with current settings, Phase 2 contribution is never applied.
                </div>
              )}

              <div className="pt-4 border-t space-y-4">
                <h3 className="font-semibold text-lg">Dividend Income (at {dividendYield}% yield)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Annual Gross</div>
                    <div className="text-xl font-semibold">{formatCurrency(annualDividendGross)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Monthly Gross</div>
                    <div className="text-xl font-semibold">{formatCurrency(monthlyDividendGross)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Annual Tax</div>
                    <div className="text-xl font-semibold text-red-500">{formatCurrency(annualDividendTax)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Effective Tax Rate</div>
                    <div className="text-xl font-semibold text-red-500">
                      {annualDividendGross > 0 ? ((annualDividendTax / annualDividendGross) * 100).toFixed(1) : '0.0'}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
                    <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Annual Net (After Tax)</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(annualDividendNet)}</div>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
                    <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Monthly Net (After Tax)</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(monthlyDividendNet)}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">UK tax calculated assuming no other income. Includes £12,570 personal allowance + £500 dividend allowance. Rates: 8.75% basic, 33.75% higher, 39.35% additional.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
