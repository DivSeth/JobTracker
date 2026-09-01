import { getStatusColumns, STATUS_TRANSITIONS } from '@/components/applications/ApplicationKanban'

it('getStatusColumns returns the active board columns', () => {
  const cols = getStatusColumns()
  expect(cols.map(c => c.id)).toEqual(['saved', 'applied', 'oa', 'interviewing', 'offer', 'rejected'])
})

it('ghosted is grouped into the rejected Kanban column', () => {
  const ids = getStatusColumns().map(c => c.id)
  expect(ids).toContain('rejected')
  expect(ids).not.toContain('ghosted')
})

it('STATUS_TRANSITIONS advances linearly', () => {
  expect(STATUS_TRANSITIONS['saved']).toBe('applied')
  expect(STATUS_TRANSITIONS['applied']).toBe('oa')
  expect(STATUS_TRANSITIONS['offer']).toBeNull()
})
