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
    expect(mapped.transform).toBe('first_name')
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

    expect(mapped.isMasked).toBe(true)
    expect(mapped.profileValue).toBe('authorized')
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
