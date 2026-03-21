import {
  parseAddedMarkdownRows,
  regexParseJobRow,
  isJobActive,
} from '@/lib/github/sync'

const FIXTURE_DIFF = `
+| Google | Software Engineer, New Grad | Mountain View, CA | <a href="https://careers.google.com/jobs/123">Apply</a> | Mar 20 |
+| Stripe | Software Engineer Intern | San Francisco, CA | <a href="https://stripe.com/jobs/456">Apply</a> | Mar 20 |
+| ~~Meta~~ | ~~Software Engineer~~ | ~~Menlo Park, CA~~ | 🔒 | Mar 19 |
 | Existing | Unchanged Role | New York | <a href="...">Apply</a> | Mar 15 |
-| Removed | Old Role | Chicago | <a href="...">Apply</a> | Mar 10 |
`

describe('parseAddedMarkdownRows', () => {
  it('returns only lines starting with +|', () => {
    const rows = parseAddedMarkdownRows(FIXTURE_DIFF)
    expect(rows).toHaveLength(3)
  })

  it('strips leading + from returned rows', () => {
    const rows = parseAddedMarkdownRows(FIXTURE_DIFF)
    expect(rows[0].startsWith('+')).toBe(false)
    expect(rows[0].startsWith('|')).toBe(true)
  })
})

describe('regexParseJobRow', () => {
  it('parses a standard SimplifyJobs row', () => {
    const row = '| Google | Software Engineer, New Grad | Mountain View, CA | <a href="https://careers.google.com/jobs/123">Apply</a> | Mar 20 |'
    const result = regexParseJobRow(row)
    expect(result).not.toBeNull()
    expect(result!.company).toBe('Google')
    expect(result!.title).toBe('Software Engineer, New Grad')
    expect(result!.location).toBe('Mountain View, CA')
    expect(result!.apply_url).toBe('https://careers.google.com/jobs/123')
  })

  it('returns null for separator rows', () => {
    expect(regexParseJobRow('| --- | --- | --- | --- | --- |')).toBeNull()
  })

  it('returns null for header rows', () => {
    expect(regexParseJobRow('| Company | Role | Location | Link | Date |')).toBeNull()
  })

  it('returns null for rows with fewer than 3 cells', () => {
    expect(regexParseJobRow('| Only | Two |')).toBeNull()
  })
})

describe('isJobActive', () => {
  it('returns false for strikethrough rows', () => {
    expect(isJobActive('| ~~Meta~~ | ~~Role~~ | ~~Location~~ | 🔒 |')).toBe(false)
  })

  it('returns false for locked rows', () => {
    expect(isJobActive('| Company | Role | Location | 🔒 |')).toBe(false)
  })

  it('returns true for normal rows', () => {
    expect(isJobActive('| Google | SWE | Mountain View | <a href="...">Apply</a> |')).toBe(true)
  })
})
