'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Profile, ExperienceEntry, EducationEntry, ProfileDetails } from '@/lib/types'

interface Props {
  initialProfile: Partial<Profile>
}

const emptyExp = (): ExperienceEntry => ({
  company: '', role: '', employment_type: 'internship',
  start: '', end: null, bullets: [''],
})

const emptyEdu = (): EducationEntry => ({
  school: '', degree: '', major: '', graduation_year: new Date().getFullYear(),
})

export function ProfileForm({ initialProfile }: Props) {
  const [details, setDetails] = useState<ProfileDetails>({
    full_name: null, phone: null, location: null,
    bio: null, resume_url: null, portfolio_url: null,
    ...((initialProfile as any)?.profile_details ?? {}),
  })
  const [skills, setSkills] = useState(
    (initialProfile.skills ?? []).join(', ')
  )
  const [experience, setExperience] = useState<ExperienceEntry[]>(
    initialProfile.experience ?? []
  )
  const [education, setEducation] = useState<EducationEntry[]>(
    initialProfile.education ?? []
  )
  const [prefs, setPrefs] = useState(
    initialProfile.preferences ?? { job_types: [], locations: [], remote_ok: false, min_salary: null }
  )
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_details: details,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        experience,
        education,
        preferences: prefs,
      }),
    })
    setSaving(false)
  }

  const completedFields = [
    details.full_name, details.phone, details.location, details.bio,
    skills, experience.length > 0, education.length > 0,
  ].filter(Boolean).length
  const completionPct = Math.round((completedFields / 7) * 100)

  return (
    <div className="flex gap-8 p-8">
      {/* Left panel */}
      <div className="w-44 shrink-0 space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center text-xl font-semibold text-on-surface-muted mx-auto">
          {(details.full_name ?? 'AU').slice(0, 2).toUpperCase()}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-on-surface">{details.full_name || 'Your Name'}</p>
          <p className="text-xs text-on-surface-muted mt-0.5">
            {experience[0]?.role || 'Add your role'}
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="label-sm text-on-surface-muted">Profile Score</span>
              <span className="label-sm text-on-surface">{completionPct}%</span>
            </div>
            <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>
        {details.resume_url && (
          <a href={details.resume_url} target="_blank" rel="noopener noreferrer"
             className="block text-xs text-primary hover:underline truncate">
            Resume
          </a>
        )}
        {details.portfolio_url && (
          <a href={details.portfolio_url} target="_blank" rel="noopener noreferrer"
             className="block text-xs text-primary hover:underline truncate">
            Portfolio
          </a>
        )}
      </div>

      {/* Right panels */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-8">
        {/* Personal Details */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-on-surface">Personal Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" id="full_name" placeholder="Alex Rivera"
              value={details.full_name ?? ''} onChange={e => setDetails(d => ({ ...d, full_name: e.target.value }))} />
            <Input label="Phone" id="phone" placeholder="+1 (000) 000-0000"
              value={details.phone ?? ''} onChange={e => setDetails(d => ({ ...d, phone: e.target.value }))} />
            <Input label="Location" id="location" placeholder="San Francisco, CA"
              value={details.location ?? ''} onChange={e => setDetails(d => ({ ...d, location: e.target.value }))} />
            <Input label="Resume URL" id="resume_url" placeholder="https://..."
              value={details.resume_url ?? ''} onChange={e => setDetails(d => ({ ...d, resume_url: e.target.value }))} />
            <Input label="Portfolio URL" id="portfolio_url" placeholder="https://..."
              value={details.portfolio_url ?? ''} onChange={e => setDetails(d => ({ ...d, portfolio_url: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bio" className="block label-sm text-on-surface-muted">Bio</label>
            <textarea
              id="bio" rows={3}
              className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#0053db]/20 placeholder:text-on-surface-muted/50 resize-none"
              placeholder="Short bio..."
              value={details.bio ?? ''}
              onChange={e => setDetails(d => ({ ...d, bio: e.target.value }))}
            />
          </div>
        </section>

        {/* Work Experience */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-on-surface">Work Experience</h2>
            <Button type="button" variant="secondary" size="sm"
              onClick={() => setExperience(ex => [...ex, emptyExp()])}>
              + Add Position
            </Button>
          </div>
          {experience.map((exp, i) => (
            <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Company" id={`exp_company_${i}`} placeholder="Company name"
                  value={exp.company} onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, company: e.target.value } : x))} />
                <Input label="Role" id={`exp_role_${i}`} placeholder="Software Engineer"
                  value={exp.role} onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} />
                <Input label="Start" id={`exp_start_${i}`} placeholder="Jan 2024"
                  value={exp.start} onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, start: e.target.value } : x))} />
                <Input label="End" id={`exp_end_${i}`} placeholder="Present"
                  value={exp.end ?? ''} onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, end: e.target.value || null } : x))} />
              </div>
              <div className="flex items-center justify-end">
                <button type="button" onClick={() => setExperience(ex => ex.filter((_, j) => j !== i))}
                  className="text-xs text-on-surface-muted/60 hover:text-red-500 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {experience.length === 0 && (
            <p className="text-sm text-on-surface-muted/60 text-center py-4">No positions added yet.</p>
          )}
        </section>

        {/* Education */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-on-surface">Education</h2>
            <Button type="button" variant="secondary" size="sm"
              onClick={() => setEducation(ed => [...ed, emptyEdu()])}>
              + Add Education
            </Button>
          </div>
          {education.map((edu, i) => (
            <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="School" id={`edu_school_${i}`} placeholder="University of..."
                  value={edu.school} onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, school: e.target.value } : x))} />
                <Input label="Degree" id={`edu_degree_${i}`} placeholder="B.S. Computer Science"
                  value={edu.degree} onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))} />
                <Input label="Graduation Year" id={`edu_year_${i}`} type="number"
                  value={edu.graduation_year} onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, graduation_year: Number(e.target.value) } : x))} />
                <Input label="GPA (optional)" id={`edu_gpa_${i}`} type="number" step="0.01"
                  value={(edu as any).gpa ?? ''} onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, gpa: e.target.value ? Number(e.target.value) : undefined } : x))} />
              </div>
              <div className="flex items-center justify-end">
                <button type="button" onClick={() => setEducation(ed => ed.filter((_, j) => j !== i))}
                  className="text-xs text-on-surface-muted/60 hover:text-red-500 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Skills */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-on-surface">Skills</h2>
          <Input
            label="Skills"
            id="skills"
            placeholder="React, TypeScript, Python, Go..."
            value={skills}
            onChange={e => setSkills(e.target.value)}
          />
          <p className="text-xs text-on-surface-muted">Separate with commas. Use exact tech names for better job matching.</p>
        </section>

        {/* Preferences */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-on-surface">Preferences</h2>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="remote_ok"
              className="w-4 h-4 rounded accent-primary"
              checked={prefs.remote_ok}
              onChange={e => setPrefs(p => ({ ...p, remote_ok: e.target.checked }))}
            />
            <label htmlFor="remote_ok" className="text-sm text-on-surface">Open to remote</label>
          </div>
        </section>

        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </Button>
      </form>
    </div>
  )
}
