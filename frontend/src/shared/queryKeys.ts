const domainKeys = (domain) => ({
  all: [domain],
  lists: [domain, 'list'],
  list: (filters) => [domain, 'list', filters],
  details: [domain, 'detail'],
  detail: (id) => [domain, 'detail', id],
})

export const personKeys = domainKeys('person')
export const familyKeys = domainKeys('family')
export const zoneKeys = domainKeys('zone')
export const settingKeys = domainKeys('setting')
export const dashboardKeys = Object.freeze({
  all: ['dashboard'],
  summary: ['dashboard', 'summary'],
})
