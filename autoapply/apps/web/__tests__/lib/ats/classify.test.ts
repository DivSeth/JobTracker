import { isSWERole, classifyJobType, normalizeKey } from '@/lib/ats/classify'

describe('isSWERole', () => {
  it('matches standard software engineering titles', () => {
    expect(isSWERole('Software Engineer')).toBe(true)
    expect(isSWERole('Senior Software Developer')).toBe(true)
    expect(isSWERole('Frontend Engineer')).toBe(true)
    expect(isSWERole('Backend Developer')).toBe(true)
    expect(isSWERole('Full Stack Engineer')).toBe(true)
    expect(isSWERole('Full-Stack Developer')).toBe(true)
    expect(isSWERole('SWE Intern')).toBe(true)
    expect(isSWERole('DevOps Engineer')).toBe(true)
    expect(isSWERole('SRE')).toBe(true)
    expect(isSWERole('Platform Engineer')).toBe(true)
    expect(isSWERole('ML Engineer')).toBe(true)
    expect(isSWERole('Data Engineer')).toBe(true)
    expect(isSWERole('Mobile Developer')).toBe(true)
    expect(isSWERole('iOS Engineer')).toBe(true)
    expect(isSWERole('Android Developer')).toBe(true)
    expect(isSWERole('Infrastructure Engineer')).toBe(true)
    expect(isSWERole('Cloud Engineer')).toBe(true)
    expect(isSWERole('Systems Engineer')).toBe(true)
    expect(isSWERole('Embedded Software Engineer')).toBe(true)
    expect(isSWERole('Security Engineer')).toBe(true)
    expect(isSWERole('QA Engineer')).toBe(true)
    expect(isSWERole('SDET')).toBe(true)
    expect(isSWERole('Test Engineer')).toBe(true)
  })

  it('rejects non-SWE titles', () => {
    expect(isSWERole('Product Manager')).toBe(false)
    expect(isSWERole('Marketing Director')).toBe(false)
    expect(isSWERole('Sales Representative')).toBe(false)
    expect(isSWERole('HR Coordinator')).toBe(false)
    expect(isSWERole('Recruiter')).toBe(false)
    expect(isSWERole('Office Manager')).toBe(false)
    expect(isSWERole('Data Analyst')).toBe(false)
    expect(isSWERole('Business Analyst')).toBe(false)
  })
})

describe('classifyJobType', () => {
  it('classifies internship titles', () => {
    expect(classifyJobType('Software Engineer Intern')).toBe('internship')
    expect(classifyJobType('SWE Internship - Summer 2026')).toBe('internship')
    expect(classifyJobType('Co-Op Software Developer')).toBe('internship')
    expect(classifyJobType('Engineering Coop')).toBe('internship')
  })

  it('classifies new grad titles', () => {
    expect(classifyJobType('Software Engineer, New Grad')).toBe('new_grad')
    expect(classifyJobType('New-Grad Software Engineer')).toBe('new_grad')
    expect(classifyJobType('Entry Level Developer')).toBe('new_grad')
    expect(classifyJobType('Junior Software Engineer')).toBe('new_grad')
    expect(classifyJobType('Associate Software Engineer')).toBe('new_grad')
    expect(classifyJobType('University Graduate Engineer')).toBe('new_grad')
    expect(classifyJobType('Early Career Software Engineer')).toBe('new_grad')
  })

  it('classifies everything else as fulltime', () => {
    expect(classifyJobType('Senior Software Engineer')).toBe('fulltime')
    expect(classifyJobType('Staff Engineer')).toBe('fulltime')
    expect(classifyJobType('Principal Developer')).toBe('fulltime')
  })

  it('prioritizes internship over new grad keywords', () => {
    expect(classifyJobType('Junior Intern Developer')).toBe('internship')
  })
})

describe('normalizeKey', () => {
  it('lowercases and strips non-alphanumeric', () => {
    expect(normalizeKey('Google', 'Software Engineer', 'Mountain View, CA'))
      .toBe('google|softwareengineer|mountainviewca')
  })

  it('uses "unknown" for null location', () => {
    expect(normalizeKey('Stripe', 'SWE', null))
      .toBe('stripe|swe|unknown')
  })

  it('produces same key for punctuation variants', () => {
    const a = normalizeKey('Google', 'Software Engineer - Backend', 'NYC')
    const b = normalizeKey('Google', 'Software Engineer, Backend', 'NYC')
    expect(a).toBe(b)
  })
})
