import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { calculateAutoSacrifice } from '@/lib/calculations/pension'
import type { WorkplacePot, PersonalPot, PotProjection, TaxYearConfig } from '@/lib/calculations'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
}

interface WorkplacePotCardProps {
  pot: WorkplacePot
  onChange: (next: WorkplacePot) => void
  projection?: PotProjection
  grossSalary: number
  targetANI: number
  config: TaxYearConfig
}

const ACCESS_MODES: { value: WorkplacePot['accessMode']; label: string }[] = [
  { value: 'drawdown', label: 'Drawdown' },
  { value: 'annuity', label: 'Annuity' },
  { value: 'lump_sum', label: 'Lump Sum' },
  { value: 'locked', label: 'Locked' },
]

export function WorkplacePotCard({ pot, onChange, projection, grossSalary, targetANI, config }: WorkplacePotCardProps) {
  const autoSacrifice = calculateAutoSacrifice(grossSalary, targetANI, config)
  const annualSacrifice = pot.monthlySacrifice * 12
  const exceedsAllowance = annualSacrifice > config.pensionAnnualAllowance

  const handleChange = <K extends keyof WorkplacePot>(key: K, value: WorkplacePot[K]) => {
    onChange({ ...pot, [key]: value })
  }

  const handleNumberChange = <K extends keyof WorkplacePot>(key: K, value: string) => {
    const num = Number(value)
    if (Number.isNaN(num)) return
    handleChange(key, num as WorkplacePot[K])
  }

  const handleSacrificeChange = (value: string) => {
    const num = Number(value)
    if (Number.isNaN(num)) return
    const maxMonthly = grossSalary / 12
    const maxMonthlyByAllowance = config.pensionAnnualAllowance / 12
    const clamped = Math.min(Math.max(0, num), maxMonthly, maxMonthlyByAllowance)
    onChange({ ...pot, monthlySacrifice: clamped })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workplace Pension</CardTitle>
        <CardDescription>Salary sacrifice pot with employer match and NEST-style fees.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wp-currentValue">Current Value (£)</Label>
          <Input id="wp-currentValue" type="number" value={pot.currentValue === 0 ? '' : pot.currentValue} onChange={(e) => handleNumberChange('currentValue', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wp-monthlySacrifice">Monthly Sacrifice (£)</Label>
          <div className="flex gap-2">
            <Input id="wp-monthlySacrifice" type="number" value={pot.monthlySacrifice === 0 ? '' : pot.monthlySacrifice} onChange={(e) => handleSacrificeChange(e.target.value)} />
            <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => handleChange('monthlySacrifice', autoSacrifice.monthlySacrifice)}>
              Auto: £{Math.round(autoSacrifice.monthlySacrifice).toLocaleString('en-GB')}
            </Button>
          </div>
          {autoSacrifice.cappedByAnnualAllowance && (
            <p className="text-xs text-amber-600">Auto-calc capped by £{config.pensionAnnualAllowance.toLocaleString('en-GB')} annual allowance.</p>
          )}
          {exceedsAllowance && (
            <p className="text-xs text-red-600 font-medium">Warning: Annual sacrifice (£{Math.round(annualSacrifice).toLocaleString('en-GB')}) exceeds £{config.pensionAnnualAllowance.toLocaleString('en-GB')} allowance.</p>
          )}
          {pot.monthlySacrifice * 12 >= config.pensionAnnualAllowance && (
            <p className="text-xs text-amber-600">At annual allowance cap (£{config.pensionAnnualAllowance.toLocaleString('en-GB')}/yr).</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wp-employerMatchPercent">Employer Match (%)</Label>
            <Input id="wp-employerMatchPercent" type="number" step="0.1" value={pot.employerMatchPercent === 0 ? '' : pot.employerMatchPercent} onChange={(e) => handleNumberChange('employerMatchPercent', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp-matchBaseSalary">Match Base Salary (£)</Label>
            <Input id="wp-matchBaseSalary" type="number" value={pot.matchBaseSalary === 0 ? '' : pot.matchBaseSalary} onChange={(e) => handleNumberChange('matchBaseSalary', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wp-realGrowthRate">Real Growth Rate (%)</Label>
            <Input id="wp-realGrowthRate" type="number" step="0.1" value={pot.realGrowthRate * 100} onChange={(e) => handleNumberChange('realGrowthRate', (Number(e.target.value) / 100).toString())} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp-amc">AMC (%)</Label>
            <Input id="wp-amc" type="number" step="0.01" value={pot.amc * 100} onChange={(e) => handleNumberChange('amc', (Number(e.target.value) / 100).toString())} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wp-contributionCharge">Contribution Charge (%)</Label>
            <Input id="wp-contributionCharge" type="number" step="0.1" value={pot.contributionCharge * 100} onChange={(e) => handleNumberChange('contributionCharge', (Number(e.target.value) / 100).toString())} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wp-accessMode">Access Mode</Label>
          <select
            id="wp-accessMode"
            value={pot.accessMode}
            onChange={(e) => handleChange('accessMode', e.target.value as WorkplacePot['accessMode'])}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ACCESS_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wp-retirementAge">Retirement Age</Label>
          <Input id="wp-retirementAge" type="number" value={pot.retirementAge === 0 ? '' : pot.retirementAge} onChange={(e) => handleNumberChange('retirementAge', e.target.value)} />
        </div>

        {projection && (
          <div className="p-3 bg-muted/40 rounded-lg space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Projected at Retirement</div>
            <div className="text-2xl font-bold">{formatCurrency(projection.valueAtRetirement)}</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Contributed: {formatCurrency(projection.totalContributed)}</div>
              <div>Growth: {formatCurrency(projection.totalGrowth)}</div>
              <div className="col-span-2">Years to retirement: {projection.yearsToRetirement}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PersonalPotCardProps {
  pot: PersonalPot
  onChange: (next: PersonalPot) => void
  projection?: PotProjection
}

const PERSONAL_ACCESS_MODES: { value: PersonalPot['accessMode']; label: string }[] = [
  { value: 'drawdown', label: 'Drawdown' },
  { value: 'annuity', label: 'Annuity' },
  { value: 'lump_sum', label: 'Lump Sum' },
  { value: 'locked', label: 'Locked' },
]

export function PersonalPotCard({ pot, onChange, projection }: PersonalPotCardProps) {
  const handleChange = <K extends keyof PersonalPot>(key: K, value: PersonalPot[K]) => {
    onChange({ ...pot, [key]: value })
  }

  const handleNumberChange = <K extends keyof PersonalPot>(key: K, value: string) => {
    const num = Number(value)
    if (Number.isNaN(num)) return
    handleChange(key, num as PersonalPot[K])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Pension</CardTitle>
        <CardDescription>Manual contributions, post-tax, no salary sacrifice.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pp-currentValue">Current Value (£)</Label>
          <Input id="pp-currentValue" type="number" value={pot.currentValue === 0 ? '' : pot.currentValue} onChange={(e) => handleNumberChange('currentValue', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pp-monthlyContribution">Monthly Contribution (£)</Label>
          <Input id="pp-monthlyContribution" type="number" value={pot.monthlyContribution === 0 ? '' : pot.monthlyContribution} onChange={(e) => handleNumberChange('monthlyContribution', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pp-realGrowthRate">Real Growth Rate (%)</Label>
            <Input id="pp-realGrowthRate" type="number" step="0.1" value={pot.realGrowthRate * 100} onChange={(e) => handleNumberChange('realGrowthRate', (Number(e.target.value) / 100).toString())} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pp-startYear">Start Year</Label>
            <Input id="pp-startYear" type="number" value={pot.startYear === 0 ? '' : pot.startYear} onChange={(e) => handleNumberChange('startYear', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-retirementAge">Retirement Age</Label>
            <Input id="pp-retirementAge" type="number" value={pot.retirementAge === 0 ? '' : pot.retirementAge} onChange={(e) => handleNumberChange('retirementAge', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="pp-ukTaxRelief"
            type="checkbox"
            checked={pot.ukTaxRelief}
            onChange={(e) => handleChange('ukTaxRelief', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="pp-ukTaxRelief" className="text-sm">UK Tax Relief (informational)</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pp-accessMode">Access Mode</Label>
          <select
            id="pp-accessMode"
            value={pot.accessMode}
            onChange={(e) => handleChange('accessMode', e.target.value as PersonalPot['accessMode'])}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {PERSONAL_ACCESS_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {projection && (
          <div className="p-3 bg-muted/40 rounded-lg space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Projected at Retirement</div>
            <div className="text-2xl font-bold">{formatCurrency(projection.valueAtRetirement)}</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Contributed: {formatCurrency(projection.totalContributed)}</div>
              <div>Growth: {formatCurrency(projection.totalGrowth)}</div>
              <div className="col-span-2">Years to retirement: {projection.yearsToRetirement}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
