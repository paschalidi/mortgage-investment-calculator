export function calculateAgeAtEnd(
  dobString: string,
  monthsToAdd: number,
  baseDate: Date = new Date(),
): number | null {
  if (!dobString) return null
  const birthDate = new Date(dobString)
  const endDate = new Date(baseDate)
  endDate.setMonth(endDate.getMonth() + monthsToAdd)

  let age = endDate.getFullYear() - birthDate.getFullYear()
  const m = endDate.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
