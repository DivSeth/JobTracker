import { describe, it, expect } from 'vitest'
import { mapProfileToFields } from './mapper'

const profile = {
  userProfile: {
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '4155551212',
    portfolio_url: 'https://janedoe.dev',
  },
  applicationProfile: {
    resume_path: 'files/resume.pdf',
    cover_letter_path: 'files/cover-letter.pdf',
    education: [{ school: 'Stanford', degree: 'BS', major: 'CS' }],
    experience: [{ company: 'Acme', role: 'Software Engineer' }],
    skills: ['TypeScript', 'React'],
    eeo_gender: 'female',
    work_authorization: 'authorized',
  },
}

describe('mapProfileToFields', () => {
  it('maps first_name field to user profile full_name with first_name transform', () => {
    const [mapped] = mapProfileToFields(profile, [
      { selector: '#first_name', name: 'first_name', label: 'First Name', type: 'text', required: true },
    ])

    expect(mapped.profileValue).toBe('Jane')
    expect(mapped.transform).toBe('first_name_or_split')
    expect(mapped.source).toBe('user_profile')
  })

  it('maps email field to user profile email', () => {
    const [mapped] = mapProfileToFields(profile, [
      { selector: '#email', name: 'email', label: 'Email', type: 'email', required: true },
    ])

    expect(mapped.profileValue).toBe('jane@example.com')
    expect(mapped.profilePath).toBe('email')
  })

  it('maps resume field with file_upload transform', () => {
    const [mapped] = mapProfileToFields(profile, [
      { selector: '#resume', name: 'resume', label: 'Resume', type: 'file', required: true },
    ])

    expect(mapped.profileValue).toBe('files/resume.pdf')
    expect(mapped.transform).toBe('file_upload')
  })

  it('maps education fields to application_profile education[0]', () => {
    const [mapped] = mapProfileToFields(profile, [
      { selector: '#school', name: 'school', label: 'School', type: 'text', required: false },
    ])

    expect(mapped.profileValue).toBe('Stanford')
    expect(mapped.profilePath).toBe('education[0].school')
  })

  it('maps experience fields to application_profile experience[0]', () => {
    const [mapped] = mapProfileToFields(profile, [
      { selector: '#company', name: 'company', label: 'Current Company', type: 'text', required: false },
    ])

    expect(mapped.profileValue).toBe('Acme')
    expect(mapped.profilePath).toBe('experience[0].company')
  })

  it('returns unmapped MappedField with null profileValue for unknown custom questions', () => {
    const [mapped] = mapProfileToFields(profile, [
      { selector: '#question_999', name: 'question_999', label: 'Favorite editor?', type: 'text', required: false },
    ])

    expect(mapped.profileValue).toBeNull()
    expect(mapped.profilePath).toBeNull()
    expect(mapped.source).toBeNull()
  })

  it('marks EEO fields as isMasked=true', () => {
    const [mapped] = mapProfileToFields(profile, [
      { selector: '#gender', name: 'eeo_gender', label: 'Gender', type: 'select', required: false },
    ])

    expect(mapped.isMasked).toBe(true)
  })

  it('marks work_authorization fields as isMasked=true', () => {
    const [mapped] = mapProfileToFields(profile, [
      {
        selector: '#work_authorization',
        name: 'work_authorization',
        label: 'Work Authorization',
        type: 'text',
        required: false,
      },
    ])
    // isMasked based on field name containing work_authorization
    expect(mapped.isMasked).toBe(true)
    // authorized_to_work not present in the test profile's userProfile → null
    expect(mapped.profileValue).toBeNull()
  })

  it('uses regex matching for field_pattern against field name', () => {
    const [mapped] = mapProfileToFields(profile, [
      { selector: '#phone', name: 'phone_number', label: 'Contact', type: 'tel', required: false },
    ])

    expect(mapped.profileValue).toBe('(415) 555-1212')
  })

  it('uses regex matching for field_pattern against field label', () => {
    const [mapped] = mapProfileToFields(profile, [
      { selector: '#portfolio', name: 'website_field', label: 'Portfolio Website', type: 'url', required: false },
    ])

    expect(mapped.profileValue).toBe('https://janedoe.dev')
  })
})

const mergedProfile = {
  userProfile: {
    first_name: 'Jane',
    last_name: 'Doe',
    full_name: 'Jane Doe',
    email: 'jane@school.edu',
    phone: '(415) 555-1212',
    phone_e164: '+14155551212',
    linkedin_url: 'https://linkedin.com/in/janedoe',
    github_url: 'https://github.com/janedoe',
    portfolio_url: 'https://janedoe.dev',
    pronouns: 'she/her',
    country: 'US',
    authorized_to_work: true,
    needs_sponsorship_now: false,
    needs_sponsorship_future: true,
    work_auth_status: 'F-1 OPT',
    desired_salary_min: 120000,
    desired_salary_max: 150000,
    salary_currency: 'USD',
    salary_cadence: 'annual',
    notice_period_weeks: 2,
    willing_to_relocate: true,
    work_arrangement_preference: 'hybrid',
    earliest_start_date: '2026-06-01',
    referral_source: 'LinkedIn',
  },
  applicationProfile: {},
}

describe('mapProfileToFields — 02-07 identity rules', () => {
  it.each([
    ['first_name', 'First Name', 'Jane'],
    ['last_name', 'Last Name', 'Doe'],
    ['linkedin_url', 'LinkedIn', 'https://linkedin.com/in/janedoe'],
    ['github_url', 'GitHub profile', 'https://github.com/janedoe'],
    ['portfolio_url', 'Portfolio / website', 'https://janedoe.dev'],
    ['pronouns', 'Pronouns', 'she/her'],
    ['country', 'Country', 'US'],
    ['desired_salary_min', 'Desired salary', '120000'],
    ['notice_period_weeks', 'Notice period', '2'],
    ['earliest_start_date', 'Earliest start date', '2026-06-01'],
    ['referral_source', 'How did you hear about us?', 'LinkedIn'],
  ])('maps %s -> %s = %s', (name, label, expected) => {
    const [mapped] = mapProfileToFields(mergedProfile, [
      { selector: `#${name}`, name, label, type: 'text', required: false },
    ])
    expect(mapped.profileValue).toBe(expected)
  })

  it('renders authorized_to_work as "Yes" for a yes/no select', () => {
    const [mapped] = mapProfileToFields(mergedProfile, [
      {
        selector: '#auth',
        name: 'work_authorization_confirmation',
        label: 'Are you authorized to work in the United States?',
        type: 'select',
        required: true,
        options: ['Yes', 'No'],
      } as unknown as Parameters<typeof mapProfileToFields>[1][number],
    ])
    expect(mapped.profileValue).toBe('Yes')
  })

  it('renders needs_sponsorship_future as "Yes" for a future-sponsorship select', () => {
    const [mapped] = mapProfileToFields(mergedProfile, [
      {
        selector: '#sp-future',
        name: 'sponsorship_future',
        label: 'Will you now or in the future require sponsorship?',
        type: 'select',
        required: true,
        options: ['Yes', 'No'],
      } as unknown as Parameters<typeof mapProfileToFields>[1][number],
    ])
    expect(mapped.profileValue).toBe('Yes')
  })
})
