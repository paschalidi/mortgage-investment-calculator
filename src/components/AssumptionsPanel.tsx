import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TaxYearConfig } from '@/lib/calculations'

interface AssumptionsPanelProps {
  config: TaxYearConfig
  onChange: (next: TaxYearConfig) => void
}

const percentageKeys: (keyof TaxYearConfig)[] = [
  'basicRate',
  'higherRate',
  'additionalRate',
  'niRate',
  'niUpperRate',
  'dividendBasicRate',
  'dividendHigherRate',
  'dividendAdditionalRate',
  'cgtBasicRate',
  'cgtHigherRate',
  'inflationRate',
  'swr',
]

function isPercentageKey(key: keyof TaxYearConfig): boolean {
  return percentageKeys.includes(key)
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
}

export function AssumptionsPanel({ config, onChange }: AssumptionsPanelProps) {
  const [collapsed, setCollapsed] = useState(true)

  const handleChange = (key: keyof TaxYearConfig, value: string) => {
    const num = Number(value)
    if (Number.isNaN(num)) return

    const next = { ...config }
    if (isPercentageKey(key)) {
      next[key] = num / 100
    } else {
      next[key] = num
    }
    onChange(next)
  }

  const renderField = (key: keyof TaxYearConfig) => {
    const isPct = isPercentageKey(key)
    const displayValue = isPct ? (config[key] * 100).toFixed(2) : config[key]
    return (
      <div key={key} className="space-y-1">
        <Label htmlFor={key} className="text-xs">
          {formatLabel(key)} {isPct ? '(%)' : '(£)'}
        </Label>
        <Input
          id={key}
          type="number"
          step={isPct ? '0.01' : '1'}
          value={displayValue}
          onChange={(e) => handleChange(key, e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    )
  }

  const groupClass = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tax Year Assumptions</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand assumptions' : 'Collapse assumptions'}
          >
            {collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-6 pt-0">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tax Bands
            </h3>
            <div className={groupClass}>
              {renderField('personalAllowance')}
              {renderField('basicRateLimit')}
              {renderField('higherRateLimit')}
              {renderField('additionalRateThreshold')}
              {renderField('basicRate')}
              {renderField('higherRate')}
              {renderField('additionalRate')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              National Insurance
            </h3>
            <div className={groupClass}>
              {renderField('niPrimaryThreshold')}
              {renderField('niUpperEarningsLimit')}
              {renderField('niRate')}
              {renderField('niUpperRate')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Dividends
            </h3>
            <div className={groupClass}>
              {renderField('dividendAllowance')}
              {renderField('dividendBasicRate')}
              {renderField('dividendHigherRate')}
              {renderField('dividendAdditionalRate')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              CGT
            </h3>
            <div className={groupClass}>
              {renderField('cgtAnnualExempt')}
              {renderField('cgtBasicRate')}
              {renderField('cgtHigherRate')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Allowances
            </h3>
            <div className={groupClass}>
              {renderField('isaAllowance')}
              {renderField('pensionAnnualAllowance')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              State Pension
            </h3>
            <div className={groupClass}>
              {renderField('statePensionAmount')}
              {renderField('statePensionAge')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Retirement
            </h3>
            <div className={groupClass}>
              {renderField('pensionAccessAge')}
              {renderField('lifeExpectancy')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Rates
            </h3>
            <div className={groupClass}>
              {renderField('inflationRate')}
              {renderField('swr')}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
