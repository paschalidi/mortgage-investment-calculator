import { describe, it, expect } from 'vitest'
import { calculateAgeAtEnd } from '../age'

describe('calculateAgeAtEnd', () => {
  it('returns correct age for DOB 1992-02-16 after 240 months from fixed base date', () => {
    const fixedBase = new Date('2026-06-30')
    const age = calculateAgeAtEnd('1992-02-16', 240, fixedBase)
    // 240 months = 20 years from June 2026 → June 2046
    // 2046 - 1992 = 54 (birthday in Feb has passed by June)
    expect(age).toBe(54)
  })
})
