import { getStatusColumns, STATUS_TRANSITIONS } from '@/components/applications/ApplicationKanban'

it('getStatusColumns returns 5 primary columns', () => {
  const cols = getStatusColumns()
  expect(cols.map(c => c.id)).toEqual(['saved', 'applied', 'oa', 'interviewing', 'offer'])
})

it('rejected and ghosted are not primary Kanban columns', () => {
  const ids = getStatusColumns().map(c => c.id)
  expect(ids).not.toContain('rejected')
  expect(ids).not.toContain('ghosted')
})

it('STATUS_TRANSITIONS advances linearly', () => {
  expect(STATUS_TRANSITIONS['saved']).toBe('applied')
  expect(STATUS_TRANSITIONS['applied']).toBe('oa')
  expect(STATUS_TRANSITIONS['offer']).toBeNull()
})
