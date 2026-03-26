'use client'
import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/ui/tag-input'
import type { ExperienceEntry, EducationEntry, CertificationEntry, LanguageEntry } from '@/lib/types'

export interface ResumeParseData {
  experience: ExperienceEntry[]
  education: EducationEntry[]
  skills: string[]
  certifications: CertificationEntry[]
  languages: LanguageEntry[]
}

interface Props {
  data: ResumeParseData
  onApply: (data: ResumeParseData) => void
  onDismiss: () => void
}

const emptyExperience = (): ExperienceEntry => ({
  company: '', role: '', employment_type: 'internship', start: '', end: null, bullets: [],
})

const emptyEducation = (): EducationEntry => ({
  school: '', degree: '', major: '', graduation_year: new Date().getFullYear(),
})

const emptyCertification = (): CertificationEntry => ({
  name: '', issuer: '', date: null, expiry: null,
})

const emptyLanguage = (): LanguageEntry => ({
  language: '', proficiency: 'professional',
})

export function ResumeParser({ data, onApply, onDismiss }: Props) {
  const [experience, setExperience] = useState<ExperienceEntry[]>(data.experience)
  const [education, setEducation] = useState<EducationEntry[]>(data.education)
  const [skills, setSkills] = useState<string[]>(data.skills)
  const [certifications, setCertifications] = useState<CertificationEntry[]>(data.certifications)
  const [languages, setLanguages] = useState<LanguageEntry[]>(data.languages)

  function handleApply() {
    onApply({ experience, education, skills, certifications, languages })
  }

  return (
    <div className="bg-surface-card rounded-xl p-6 space-y-6 shadow-sm mb-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold font-display text-on-surface">Review Extracted Data</h2>
        <p className="text-sm text-on-surface-muted mt-1">
          We extracted the following from your resume. Review and correct any fields before saving.
        </p>
      </div>

      {/* Experience */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-on-surface">Experience</h3>
        {experience.length === 0 && (
          <p className="text-xs text-on-surface-muted">No experience extracted.</p>
        )}
        {experience.map((exp, i) => (
          <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Company"
                id={`re-exp-company-${i}`}
                placeholder="Company name"
                value={exp.company}
                onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, company: e.target.value } : x))}
              />
              <Input
                label="Role"
                id={`re-exp-role-${i}`}
                placeholder="Software Engineer Intern"
                value={exp.role}
                onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}
              />
              <div className="space-y-1.5">
                <label htmlFor={`re-exp-type-${i}`} className="block label-sm text-on-surface-muted">Employment Type</label>
                <select
                  id={`re-exp-type-${i}`}
                  value={exp.employment_type}
                  onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, employment_type: e.target.value as ExperienceEntry['employment_type'] } : x))}
                  className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="full_time">Full Time</option>
                  <option value="internship">Internship</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <Input
                label="Start Date"
                id={`re-exp-start-${i}`}
                type="month"
                value={exp.start}
                onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, start: e.target.value } : x))}
              />
              <div className="space-y-1.5">
                <label htmlFor={`re-exp-end-${i}`} className="block label-sm text-on-surface-muted">End Date</label>
                <div className="flex items-center gap-2">
                  <input
                    id={`re-exp-end-${i}`}
                    type="month"
                    value={exp.end ?? ''}
                    disabled={exp.end === null}
                    onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, end: e.target.value || null } : x))}
                    className="flex-1 bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-on-surface-muted whitespace-nowrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.end === null}
                      onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, end: e.target.checked ? null : '' } : x))}
                      className="w-3.5 h-3.5 rounded accent-primary"
                    />
                    Current
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`re-exp-bullets-${i}`} className="block label-sm text-on-surface-muted">Bullet Points (one per line)</label>
              <textarea
                id={`re-exp-bullets-${i}`}
                rows={3}
                className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-muted/50 resize-none"
                placeholder="Led development of...&#10;Improved performance by..."
                value={(exp.bullets ?? []).join('\n')}
                onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, bullets: e.target.value.split('\n') } : x))}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setExperience(ex => ex.filter((_, j) => j !== i))}
                className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-error transition-colors"
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setExperience(ex => [...ex, emptyExperience()])}>
          <Plus size={13} className="mr-1" />
          Add Experience
        </Button>
      </section>

      {/* Education */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-on-surface">Education</h3>
        {education.length === 0 && (
          <p className="text-xs text-on-surface-muted">No education extracted.</p>
        )}
        {education.map((edu, i) => (
          <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="School"
                id={`re-edu-school-${i}`}
                placeholder="University of..."
                value={edu.school}
                onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, school: e.target.value } : x))}
              />
              <Input
                label="Degree"
                id={`re-edu-degree-${i}`}
                placeholder="B.S. Computer Science"
                value={edu.degree}
                onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))}
              />
              <Input
                label="Major"
                id={`re-edu-major-${i}`}
                placeholder="Computer Science"
                value={edu.major}
                onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, major: e.target.value } : x))}
              />
              <Input
                label="GPA (optional)"
                id={`re-edu-gpa-${i}`}
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                placeholder="3.8"
                value={edu.gpa ?? ''}
                onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, gpa: e.target.value ? Number(e.target.value) : undefined } : x))}
              />
              <Input
                label="Graduation Year"
                id={`re-edu-year-${i}`}
                type="number"
                placeholder="2025"
                value={edu.graduation_year}
                onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, graduation_year: Number(e.target.value) } : x))}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEducation(ed => ed.filter((_, j) => j !== i))}
                className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-error transition-colors"
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setEducation(ed => [...ed, emptyEducation()])}>
          <Plus size={13} className="mr-1" />
          Add Education
        </Button>
      </section>

      {/* Skills */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-on-surface">Skills</h3>
        <TagInput value={skills} onChange={setSkills} />
      </section>

      {/* Certifications */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-on-surface">Certifications</h3>
        {certifications.length === 0 && (
          <p className="text-xs text-on-surface-muted">No certifications extracted.</p>
        )}
        {certifications.map((cert, i) => (
          <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                id={`re-cert-name-${i}`}
                placeholder="AWS Solutions Architect"
                value={cert.name}
                onChange={e => setCertifications(c => c.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              />
              <Input
                label="Issuer"
                id={`re-cert-issuer-${i}`}
                placeholder="Amazon Web Services"
                value={cert.issuer}
                onChange={e => setCertifications(c => c.map((x, j) => j === i ? { ...x, issuer: e.target.value } : x))}
              />
              <Input
                label="Date Issued (optional)"
                id={`re-cert-date-${i}`}
                type="month"
                value={cert.date ?? ''}
                onChange={e => setCertifications(c => c.map((x, j) => j === i ? { ...x, date: e.target.value || null } : x))}
              />
              <Input
                label="Expiry (optional)"
                id={`re-cert-expiry-${i}`}
                type="month"
                value={cert.expiry ?? ''}
                onChange={e => setCertifications(c => c.map((x, j) => j === i ? { ...x, expiry: e.target.value || null } : x))}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCertifications(c => c.filter((_, j) => j !== i))}
                className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-error transition-colors"
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setCertifications(c => [...c, emptyCertification()])}>
          <Plus size={13} className="mr-1" />
          Add Certification
        </Button>
      </section>

      {/* Languages */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-on-surface">Languages</h3>
        {languages.length === 0 && (
          <p className="text-xs text-on-surface-muted">No languages extracted.</p>
        )}
        {languages.map((lang, i) => (
          <div key={i} className="bg-surface-container rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Language"
                id={`re-lang-name-${i}`}
                placeholder="Spanish"
                value={lang.language}
                onChange={e => setLanguages(l => l.map((x, j) => j === i ? { ...x, language: e.target.value } : x))}
              />
              <div className="space-y-1.5">
                <label htmlFor={`re-lang-prof-${i}`} className="block label-sm text-on-surface-muted">Proficiency</label>
                <select
                  id={`re-lang-prof-${i}`}
                  value={lang.proficiency}
                  onChange={e => setLanguages(l => l.map((x, j) => j === i ? { ...x, proficiency: e.target.value as LanguageEntry['proficiency'] } : x))}
                  className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="native">Native</option>
                  <option value="fluent">Fluent</option>
                  <option value="professional">Professional</option>
                  <option value="basic">Basic</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => setLanguages(l => l.filter((_, j) => j !== i))}
                className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-error transition-colors"
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setLanguages(l => [...l, emptyLanguage()])}>
          <Plus size={13} className="mr-1" />
          Add Language
        </Button>
      </section>

      {/* Bottom actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-on-surface/5">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleApply}
        >
          Apply to Profile
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
