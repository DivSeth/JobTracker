import { describe, it, expect } from 'vitest'
import { getStatusColumns, STATUS_TRANSITIONS } from '@/components/applications/ApplicationKanban'

describe('ApplicationKanban', () => {
  it('getStatusColumns returns the expected 5 columns', () => {
    const columns = getStatusColumns()
    const ids = columns.map(c => c.id)
    expect(ids).toEqual(['saved', 'applied', 'oa', 'interviewing', 'offer'])
  })

  it('STATUS_TRANSITIONS maps saved→applied, applied→oa, offer→null', () => {
    expect(STATUS_TRANSITIONS['saved']).toBe('applied')
    expect(STATUS_TRANSITIONS['applied']).toBe('oa')
    expect(STATUS_TRANSITIONS['offer']).toBeNull()
  })
})
