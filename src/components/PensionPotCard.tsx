import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { HelpTip } from './HelpTip'
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
          <div className="flex items-center gap-1.5">
            <Label htmlFor="wp-currentValue">Current Value (£)</Label>
            <HelpTip content="How much your workplace pension pot is worth today. Check NEST login → 'My pot' for exact figure." />
          </div>
          <Input id="wp-currentValue" type="number" value={pot.currentValue === 0 ? '' : pot.currentValue} onChange={(e) => handleNumberChange('currentValue', e.target.value)} />
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
            <p className="mt-1 leading-relaxed">How much your workplace pension pot is worth today. Check NEST login → 'My pot' for exact figure.</p>
          </details>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="wp-monthlySacrifice">Monthly Sacrifice (£)</Label>
            <HelpTip content="What you give up from salary each month, paid into pension pre-tax. Saves 40% income tax + 2% NI." />
          </div>
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
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
            <p className="mt-1 leading-relaxed">What you give up from salary each month, paid into pension pre-tax. Saves 40% income tax + 2% NI.</p>
          </details>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="wp-employerMatchPercent">Employer Match (%)</Label>
              <HelpTip content="Free money from your employer. They match your contribution up to this cap. Always contribute at least the match maximum." />
            </div>
            <Input id="wp-employerMatchPercent" type="number" step="0.1" value={pot.employerMatchPercent === 0 ? '' : pot.employerMatchPercent} onChange={(e) => handleNumberChange('employerMatchPercent', e.target.value)} />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
              <p className="mt-1 leading-relaxed">Free money from your employer. They match your contribution up to this cap. Always contribute at least the match maximum.</p>
            </details>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="wp-matchBaseSalary">Match Base Salary (£)</Label>
              <HelpTip content="Salary your match % is calculated on. Usually your gross before sacrifice." />
            </div>
            <Input id="wp-matchBaseSalary" type="number" value={pot.matchBaseSalary === 0 ? '' : pot.matchBaseSalary} onChange={(e) => handleNumberChange('matchBaseSalary', e.target.value)} />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
              <p className="mt-1 leading-relaxed">Salary your match % is calculated on. Usually your gross before sacrifice.</p>
            </details>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="wp-realGrowthRate">Real Growth Rate (%)</Label>
              <HelpTip content="Investment return AFTER inflation. Preserves purchasing power. NEST default fund targets ~4-5% real." />
            </div>
            <Input id="wp-realGrowthRate" type="number" step="0.1" value={pot.realGrowthRate * 100} onChange={(e) => handleNumberChange('realGrowthRate', (Number(e.target.value) / 100).toString())} />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
              <p className="mt-1 leading-relaxed">Investment return AFTER inflation. Preserves purchasing power. NEST default fund targets ~4-5% real.</p>
            </details>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="wp-amc">AMC (%)</Label>
              <HelpTip content="Yearly fee on pot balance. NEST charges 0.3%/yr = £3 per £1000 of pot. Drag on long-term growth." />
            </div>
            <Input id="wp-amc" type="number" step="0.01" value={pot.amc * 100} onChange={(e) => handleNumberChange('amc', (Number(e.target.value) / 100).toString())} />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
              <p className="mt-1 leading-relaxed">Yearly fee on pot balance. NEST charges 0.3%/yr = £3 per £1000 of pot. Drag on long-term growth.</p>
            </details>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="wp-contributionCharge">Contribution Charge (%)</Label>
            <HelpTip content="One-time fee on each contribution. NEST: 1.8% for first ~10 years of membership, then 0%." />
          </div>
          <Input id="wp-contributionCharge" type="number" step="0.1" value={pot.contributionCharge * 100} onChange={(e) => handleNumberChange('contributionCharge', (Number(e.target.value) / 100).toString())} />
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
            <p className="mt-1 leading-relaxed">One-time fee on each contribution. NEST: 1.8% for first ~10 years of membership, then 0%.</p>
          </details>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="wp-accessMode">Access Mode</Label>
            <HelpTip content="How you withdraw at retirement. Drawdown keeps pot invested; annuity trades pot for fixed income; lump sum takes all; locked = no access." />
          </div>
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
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
            <p className="mt-1 leading-relaxed">How you withdraw at retirement. Drawdown keeps pot invested; annuity trades pot for fixed income; lump sum takes all; locked = no access.</p>
          </details>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="wp-retirementAge">Retirement Age</Label>
            <HelpTip content="Age you can first access this pot. UK pension access age: 57 (rising to 58 in 2028)." />
          </div>
          <Input id="wp-retirementAge" type="number" value={pot.retirementAge === 0 ? '' : pot.retirementAge} onChange={(e) => handleNumberChange('retirementAge', e.target.value)} />
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
            <p className="mt-1 leading-relaxed">Age you can first access this pot. UK pension access age: 57 (rising to 58 in 2028).</p>
          </details>
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
          <div className="flex items-center gap-1.5">
            <Label htmlFor="pp-currentValue">Current Value (£)</Label>
            <HelpTip content="Current balance of your personal pension (e.g. Generali). Login to provider for exact figure." />
          </div>
          <Input id="pp-currentValue" type="number" value={pot.currentValue === 0 ? '' : pot.currentValue} onChange={(e) => handleNumberChange('currentValue', e.target.value)} />
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
            <p className="mt-1 leading-relaxed">Current balance of your personal pension (e.g. Generali). Login to provider for exact figure.</p>
          </details>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="pp-monthlyContribution">Monthly Contribution (£)</Label>
            <HelpTip content="Post-tax contribution to this pot. Paid from take-home pay (already taxed). Doesn't reduce ANI or help with £100k trap." />
          </div>
          <Input id="pp-monthlyContribution" type="number" value={pot.monthlyContribution === 0 ? '' : pot.monthlyContribution} onChange={(e) => handleNumberChange('monthlyContribution', e.target.value)} />
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
            <p className="mt-1 leading-relaxed">Post-tax contribution to this pot. Paid from take-home pay (already taxed). Doesn't reduce ANI or help with £100k trap.</p>
          </details>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="pp-realGrowthRate">Real Growth Rate (%)</Label>
            <HelpTip content="Investment return AFTER inflation. German Rentenversicherung typically 2-4% real." />
          </div>
          <Input id="pp-realGrowthRate" type="number" step="0.1" value={pot.realGrowthRate * 100} onChange={(e) => handleNumberChange('realGrowthRate', (Number(e.target.value) / 100).toString())} />
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
            <p className="mt-1 leading-relaxed">Investment return AFTER inflation. German Rentenversicherung typically 2-4% real.</p>
          </details>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="pp-startYear">Start Year</Label>
              <HelpTip content="Year you started contributing. Used to reconstruct past contribution history in projection." />
            </div>
            <Input id="pp-startYear" type="number" value={pot.startYear === 0 ? '' : pot.startYear} onChange={(e) => handleNumberChange('startYear', e.target.value)} />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
              <p className="mt-1 leading-relaxed">Year you started contributing. Used to reconstruct past contribution history in projection.</p>
            </details>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="pp-retirementAge">Retirement Age</Label>
              <HelpTip content="Age you can first access this pot. May differ from UK workplace pension age for foreign schemes." />
            </div>
            <Input id="pp-retirementAge" type="number" value={pot.retirementAge === 0 ? '' : pot.retirementAge} onChange={(e) => handleNumberChange('retirementAge', e.target.value)} />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
              <p className="mt-1 leading-relaxed">Age you can first access this pot. May differ from UK workplace pension age for foreign schemes.</p>
            </details>
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
          <div className="flex items-center gap-1.5">
            <Label htmlFor="pp-ukTaxRelief" className="text-sm">UK Tax Relief (informational)</Label>
            <HelpTip content="ON = reduces UK income tax (like SIPP). OFF = post-tax, no relief (typical for foreign schemes like Generali)." />
          </div>
        </div>
        <details className="text-xs text-muted-foreground ml-6">
          <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
          <p className="mt-1 leading-relaxed">ON = reduces UK income tax (like SIPP). OFF = post-tax, no relief (typical for foreign schemes like Generali).</p>
        </details>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="pp-accessMode">Access Mode</Label>
            <HelpTip content="How you withdraw at retirement. Same options as workplace pension." />
          </div>
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
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground select-none w-fit">Explain</summary>
            <p className="mt-1 leading-relaxed">How you withdraw at retirement. Same options as workplace pension.</p>
          </details>
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
