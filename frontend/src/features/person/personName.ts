export function personName(person: { holyName?: string | null; fullName?: string | null }) {
  return [person.holyName, person.fullName].filter(Boolean).join(' ')
}

export function nameWithHolyName(fullName?: string | null, holyName?: string | null) {
  return personName({ fullName, holyName })
}
