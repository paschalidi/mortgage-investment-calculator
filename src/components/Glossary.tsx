import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface GlossaryEntry {
  term: string
  definition: string
  category: 'pension' | 'tax' | 'investment'
}

const ENTRIES: GlossaryEntry[] = [
  {
    term: 'Adjusted Net Income (ANI)',
    category: 'tax',
    definition: 'Your total taxable income minus pension contributions. Determines eligibility for £100k trap benefits (childcare, Personal Allowance). Sacrifice reduces ANI pound-for-pound.'
  },
  {
    term: 'AMC (Annual Management Charge)',
    category: 'pension',
    definition: 'Yearly fee on pension pot balance, expressed as %. NEST charges 0.3%/yr = £3 per £1000 of pot. Lower is better. Good SIPPs: 0.1-0.25%.'
  },
  {
    term: 'Annuity',
    category: 'pension',
    definition: 'Irreversible trade: hand entire pension pot to insurance company, they pay fixed £/yr till death. No investment risk, no flexibility, no inheritance. Capital is GONE.'
  },
  {
    term: 'Bed-and-ISA',
    category: 'investment',
    definition: 'Selling ETFs in GIA and rebuying them inside ISA to migrate money into tax-free wrapper. Triggers CGT if gains exceed £3k/yr allowance. Spread across tax years to minimize tax.'
  },
  {
    term: 'CGT (Capital Gains Tax)',
    category: 'tax',
    definition: 'Tax on profit when selling investments. 2025/26: £3k annual allowance, then 18% (basic rate) or 24% (higher rate) on shares/ETFs. ISA = no CGT.'
  },
  {
    term: 'Contribution Charge',
    category: 'pension',
    definition: 'One-time fee when money enters pension. NEST: 1.8% on each contribution for first ~10 years of membership, then 0%. Makes NEST expensive early but cheap long-term.'
  },
  {
    term: 'Drawdown',
    category: 'pension',
    definition: 'Keep pension pot invested at retirement, withdraw flexibly. 25% tax-free + 75% taxed as income. Pot can grow or shrink. Heirs inherit remainder (tax-free if die <75, income-taxed if >75).'
  },
  {
    term: 'Employer Match',
    category: 'pension',
    definition: 'Free money. Employer matches your pension contribution up to a cap (e.g. 5% = £5,500/yr on £110k salary). ALWAYS contribute at least the match maximum — turning it down = refusing free money.'
  },
  {
    term: 'GIA (General Investment Account)',
    category: 'investment',
    definition: 'Taxable investment account. No contribution limit, no withdrawal rules, but dividends and capital gains are taxed. Your Trading 212 "Invest" account is a GIA.'
  },
  {
    term: 'Higher Rate Tax',
    category: 'tax',
    definition: '40% income tax on earnings £50,270-£125,140. You are a higher-rate taxpayer. Pension contribution relief worth 40% + 2% NI savings = 42% effective.'
  },
  {
    term: 'ISA (Individual Savings Account)',
    category: 'investment',
    definition: 'Tax-free wrapper. £20k/yr allowance. Money goes in post-tax, grows tax-free, comes out tax-free. Stocks & Shares ISA holds ETFs (e.g. Trading 212 ISA, Vanguard ISA).'
  },
  {
    term: 'Locked',
    category: 'pension',
    definition: 'Access mode meaning you cannot withdraw from this pot at retirement age (yet). Typical for foreign pensions or pots with stricter rules. Pot keeps growing but unusable.'
  },
  {
    term: 'Lump Sum',
    category: 'pension',
    definition: 'Take entire pension pot at once. 25% tax-free, 75% taxed as income (huge tax bill that year). Almost always a bad idea — pushes you into additional rate.'
  },
  {
    term: 'NEST',
    category: 'pension',
    definition: 'National Employment Savings Trust. UK government-backed workplace pension scheme, common default employer choice. Fees: 0.3% AMC + 1.8% contribution charge (drops to 0% after ~10 yrs).'
  },
  {
    term: 'NI (National Insurance)',
    category: 'tax',
    definition: '2025/26: 8% on earnings £12,570-£50,270, then 2% above £50,270. Salary sacrifice saves NI. Stops in retirement (no NI on pension income).'
  },
  {
    term: 'Personal Allowance',
    category: 'tax',
    definition: '£12,570/yr tax-free income. Tapers above £100k: lose £1 allowance per £2 earned. Gone at £125,140. Creates the 60% tax trap.'
  },
  {
    term: 'Real Growth Rate',
    category: 'investment',
    definition: 'Investment return AFTER inflation. £100 today = £100 in 20 years in real terms. NEST default fund targets ~4-5% real long-term.'
  },
  {
    term: 'Runway',
    category: 'pension',
    definition: 'Number of years your pension pot must last in retirement. Typically = life expectancy − retirement age (e.g. 95 − 57 = 38 yrs). Longer runway = lower safe withdrawal rate.'
  },
  {
    term: 'Salary Sacrifice',
    category: 'pension',
    definition: 'Legal arrangement: you agree to lower official salary, employer redirects difference to pension. Saves 40% income tax + 2% NI = 42% instant relief. Reduces ANI (helps escape £100k trap). Downsides: lower death-in-service, mortgage applications need grossing up.'
  },
  {
    term: 'SIPP (Self-Invested Personal Pension)',
    category: 'pension',
    definition: 'Personal pension you control (not via employer). Wide investment choice. Relief at source (HMRC adds 25%, you claim extra 25% via SA if higher rate). No employer NI savings like sacrifice.'
  },
  {
    term: 'State Pension',
    category: 'pension',
    definition: 'UK government pension, £11,502/yr (2025/26 full amount). Starts at age 67 (rising). Needs 35 yrs of NI contributions for full amount. Taxable as income.'
  },
  {
    term: 'SWR (Safe Withdrawal Rate)',
    category: 'investment',
    definition: '% of pot you can withdraw annually without running out. Trinity study: 4% for 30-yr US retirement. UK cautious 38-yr retirement: 3.5%. Lower SWR = more safety.'
  },
  {
    term: 'Tax-Free Lump Sum (TFLS)',
    category: 'pension',
    definition: '25% of pension pot withdrawable tax-free at retirement. Remaining 75% taxed as income. Most common: take 25% upfront, drawdown rest over years.'
  },
  {
    term: '60% Tax Trap',
    category: 'tax',
    definition: 'Effective 60% marginal rate on income £100k-£125,140. Caused by Personal Allowance taper: lose £1 PA per £2 earned = 20% extra on top of 40%. Escape via pension sacrifice to drop ANI below £100k.'
  },
  {
    term: 'Workplace Pension',
    category: 'pension',
    definition: 'Pension arranged by employer. Auto-enrolment mandatory (UK since 2012). Employer MUST contribute (min 3%). NEST is one provider; others include Aviva, Standard Life, Legal & General.'
  },
]

const CATEGORY_COLOUR: Record<GlossaryEntry['category'], string> = {
  pension: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tax: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  investment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export function Glossary() {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full"
          type="button"
        >
          <div className="text-left">
            <CardTitle>Glossary</CardTitle>
            <CardDescription>Plain-English explanations of all pension, tax, investment terms used in this section.</CardDescription>
          </div>
          {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            {ENTRIES.map((entry) => (
              <div key={entry.term}>
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm">{entry.term}</div>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', CATEGORY_COLOUR[entry.category])}>
                    {entry.category}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">{entry.definition}</div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
