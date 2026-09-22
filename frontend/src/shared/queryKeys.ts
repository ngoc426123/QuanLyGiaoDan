const domainKeys = (domain) => ({
  all: [domain],
  lists: [domain, 'list'],
  list: (filters) => [domain, 'list', filters],
  details: [domain, 'detail'],
  detail: (id) => [domain, 'detail', id],
})

export const personKeys = domainKeys('person')
export const marriageKeys = domainKeys('marriage')
export const familyKeys = domainKeys('family')
export const zoneKeys = domainKeys('zone')
export const settingKeys = domainKeys('setting')
export const dashboardKeys = Object.freeze({
  all: ['dashboard'],
  summary: ['dashboard', 'summary'],
})
export const appKeys = Object.freeze({
  all: ['app'],
  version: ['app', 'version'],
})
export const searchKeys = Object.freeze({
  all: ['search'],
  query: (query: string) => ['search', query],
})
export const trashKeys = Object.freeze({
  all: ['trash'],
  list: () => ['trash', 'list'],
})
