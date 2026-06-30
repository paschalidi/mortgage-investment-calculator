import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  calculateIncomeTax,
  calculateTakeHome,
  calculateANI,
  costOfOnePoundOver100k,
} from '@/lib/calculations/tax'
import { calculateAutoSacrifice } from '@/lib/calculations/pension'
import type { TaxYearConfig } from '@/lib/calculations'

interface TaxDashboardProps {
  grossSalary: number
  pensionSacrifice: number
  config: TaxYearConfig
  childcareValueAnnual?: number
  onGrossSalaryChange?: (value: number) => void
  onPensionSacrificeChange?: (value: number) => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
}

export function TaxDashboard({
  grossSalary,
  pensionSacrifice,
  config,
  childcareValueAnnual,
  onGrossSalaryChange,
  onPensionSacrificeChange,
}: TaxDashboardProps) {
  const ani = calculateANI(grossSalary, pensionSacrifice, config)
  const { ni, takeHomeAnnual, takeHomeMonthly } = calculateTakeHome(ani, config)
  const { bands } = calculateIncomeTax(ani, config)
  const trapZoneEnd = 100000 + config.personalAllowance * 2

  const costOfOnePound = costOfOnePoundOver100k(config, childcareValueAnnual)

  // NI breakdown
  const niMain = Math.min(
    Math.max(0, ani - config.niPrimaryThreshold),
    config.niUpperEarningsLimit - config.niPrimaryThreshold,
  ) * config.niRate
  const niUpper = Math.max(0, ani - config.niUpperEarningsLimit) * config.niUpperRate

  const autoSacrifice = calculateAutoSacrifice(grossSalary, 99000, config)

  return (
    <div className="space-y-6">
      {/* 5a. Salary & ANI Input Card */}
      <Card>
          <CardHeader>
            <CardTitle>Salary & ANI</CardTitle>
            <CardDescription>Enter your gross salary and pension sacrifice to see take-home pay.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="grossSalary">Gross salary (£/yr)</Label>
              <Input
                id="grossSalary"
                type="number"
                value={grossSalary === 0 ? '' : grossSalary}
                onChange={(e) => onGrossSalaryChange?.(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">This is your pre-tax annual salary.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pensionSacrifice">Pension salary sacrifice (£/yr)</Label>
              <div className="flex gap-2">
                <Input
                  id="pensionSacrifice"
                  type="number"
                  value={pensionSacrifice === 0 ? '' : pensionSacrifice}
                  onChange={(e) => onPensionSacrificeChange?.(Number(e.target.value))}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => onPensionSacrificeChange?.(Math.round(autoSacrifice.annualSacrifice))}
                >
                  Auto: £{Math.round(autoSacrifice.annualSacrifice).toLocaleString('en-GB')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {autoSacrifice.cappedByAnnualAllowance && (
                  <span className="text-amber-600">Capped by £{config.pensionAnnualAllowance.toLocaleString('en-GB')} annual allowance.</span>
                )}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${ani < 100000 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-sm font-medium text-muted-foreground mb-1">Adjusted Net Income (ANI)</div>
              <div className={`text-3xl font-bold ${ani < 100000 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(ani)}
              </div>
              {ani >= 100000 && (
                <p className="text-sm text-red-600 mt-1 font-medium">60% tax trap active</p>
              )}
              {ani < 100000 && (
                <p className="text-sm text-green-600 mt-1">You are below the 60% trap threshold.</p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Take-home Breakdown</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Gross</span>
                <span className="font-medium">{formatCurrency(grossSalary)}</span>
              </div>

              <div className="space-y-1">
                {bands.map((band) => (
                  band.taxable > 0 && (
                    <div key={band.name} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {band.name === 'Personal Allowance' ? 'Personal Allowance' : `Income tax (${(band.rate * 100).toFixed(0)}%)`}
                      </span>
                      <span className="font-medium">
                        {band.name === 'Personal Allowance' ? `£${band.taxable.toLocaleString('en-GB')}` : `-${formatCurrency(band.tax)}`}
                      </span>
                    </div>
                  )
                ))}
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">National Insurance</span>
                <span className="font-medium">-{formatCurrency(ni)}</span>
              </div>
              {niUpper > 0 && (
                <div className="text-xs text-muted-foreground pl-4">
                  {formatCurrency(niMain)} (8%) + {formatCurrency(niUpper)} (2%)
                </div>
              )}

              <div className="flex justify-between items-center p-2 bg-muted/40 rounded text-sm font-semibold">
                <span>Take-home annual</span>
                <span>{formatCurrency(takeHomeAnnual)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="font-medium">Take-home monthly</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(takeHomeMonthly)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* 5c. 60% Trap Callout Card */}
      <Card className={ani >= 100000 ? 'border-red-300 bg-red-50/50' : 'border-green-300 bg-green-50/50'}>
        <CardHeader>
          <CardTitle className={ani >= 100000 ? 'text-red-800' : 'text-green-800'}>
            {ani >= 100000 ? '⚠️ 60% Tax Trap Active' : '✅ Below the 60% Tax Trap'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Cost of earning £1 over £100,000
              </div>
              <div className={`text-3xl font-bold ${ani >= 100000 ? 'text-red-700' : 'text-green-700'}`}>
                {(costOfOnePound.marginalRate * 100).toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {costOfOnePound.description}
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Trap zone</div>
              <div className="text-lg font-semibold">
                £100,000 – £{trapZoneEnd.toLocaleString('en-GB')}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Personal allowance tapers £1 for every £2 earned above £100,000.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
