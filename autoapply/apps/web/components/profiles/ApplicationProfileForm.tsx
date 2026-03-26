'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TagInput } from '@/components/ui/tag-input'
import { ResumeUploader } from '@/components/profiles/ResumeUploader'
import { applicationProfileSchema } from '@/lib/schemas/application-profile'
import type { ApplicationProfile, ExperienceEntry, EducationEntry, CertificationEntry, LanguageEntry } from '@/lib/types'

interface Props {
  profile: ApplicationProfile
}

const emptyExperience = (): ExperienceEntry => ({
  company: '', role: '', employment_type: 'internship',
  start: '', end: null, bullets: [],
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

const EEO_GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other']
const EEO_RACES = [
  'American Indian or Alaskan Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Other Pacific Islander',
  'Two or more races',
  'White',
  'Prefer not to say',
]
const EEO_VETERAN_STATUSES = ['Not a veteran', 'Protected veteran', 'Prefer not to say']
const EEO_DISABILITY_STATUSES = ['Yes', 'No', 'Prefer not to say']
const WORK_AUTHORIZATIONS = ['US Citizen', 'Green Card', 'H1B', 'OPT', 'CPT', 'Other']

export function ApplicationProfileForm({ profile }: Props) {
  const router = useRouter()
  const [name, setName] = useState(profile.name)
  const [experience, setExperience] = useState<ExperienceEntry[]>(profile.experience ?? [])
  const [education, setEducation] = useState<EducationEntry[]>(profile.education ?? [])
  const [skills, setSkills] = useState<string[]>(profile.skills ?? [])
  const [certifications, setCertifications] = useState<CertificationEntry[]>(profile.certifications ?? [])
  const [languages, setLanguages] = useState<LanguageEntry[]>(profile.languages ?? [])
  const [eeoGender, setEeoGender] = useState(profile.eeo_gender ?? '')
  const [eeoRace, setEeoRace] = useState(profile.eeo_race ?? '')
  const [eeoVeteranStatus, setEeoVeteranStatus] = useState(profile.eeo_veteran_status ?? '')
  const [eeoDisabilityStatus, setEeoDisabilityStatus] = useState(profile.eeo_disability_status ?? '')
  const [workAuthorization, setWorkAuthorization] = useState(profile.work_authorization ?? '')
  const [sponsorshipRequired, setSponsorshipRequired] = useState(profile.sponsorship_required ?? false)
  const [resumePath, setResumePath] = useState(profile.resume_path)
  const [coverLetterPath, setCoverLetterPath] = useState(profile.cover_letter_path)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [tabErrors, setTabErrors] = useState<Record<string, boolean>>({})

  function markDirty() {
    setIsDirty(true)
  }

  function handleUploadComplete(type: 'resume' | 'cover_letter', path: string) {
    if (type === 'resume') setResumePath(path)
    else setCoverLetterPath(path)
    markDirty()
  }

  async function handleSave() {
    const formData = {
      name,
      is_default: profile.is_default,
      experience,
      education,
      skills,
      certifications,
      languages,
      eeo_gender: eeoGender || null,
      eeo_race: eeoRace || null,
      eeo_veteran_status: eeoVeteranStatus || null,
      eeo_disability_status: eeoDisabilityStatus || null,
      work_authorization: workAuthorization || null,
      sponsorship_required: sponsorshipRequired,
      resume_path: resumePath,
      cover_letter_path: coverLetterPath,
    }

    const result = applicationProfileSchema.safeParse(formData)
    if (!result.success) {
      const errors: Record<string, boolean> = {}
      result.error.issues.forEach(issue => {
        const path = issue.path[0]
        if (path === 'experience' || path === 'name') errors['experience'] = true
        if (path === 'education') errors['education'] = true
        if (path === 'skills' || path === 'certifications' || path === 'languages') errors['skills'] = true
        if (path?.toString().startsWith('eeo') || path === 'work_authorization' || path === 'sponsorship_required') errors['eeo'] = true
      })
      setTabErrors(errors)
      return
    }

    setTabErrors({})
    setSaving(true)
    setSaveError(null)

    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Save failed')
      setIsDirty(false)
      router.refresh()
    } catch {
      setSaveError('Could not save profile. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Profile name */}
      <div className="mb-6">
        <Input
          label="Profile Name"
          id="profile-name"
          value={name}
          placeholder="e.g. Software Engineer — Internship"
          onChange={e => { setName(e.target.value); markDirty() }}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="experience">
        <TabsList className="mb-6">
          <TabsTrigger value="experience" className="relative">
            Experience
            {tabErrors['experience'] && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-error" />
            )}
          </TabsTrigger>
          <TabsTrigger value="education" className="relative">
            Education
            {tabErrors['education'] && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-error" />
            )}
          </TabsTrigger>
          <TabsTrigger value="skills" className="relative">
            Skills &amp; Certs
            {tabErrors['skills'] && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-error" />
            )}
          </TabsTrigger>
          <TabsTrigger value="eeo" className="relative">
            EEO &amp; Authorization
            {tabErrors['eeo'] && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-error" />
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-4">
          {experience.length === 0 && (
            <p className="text-sm text-on-surface-muted py-4">No experience entries yet. Add your first one.</p>
          )}
          {experience.map((exp, i) => (
            <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Company"
                  id={`exp-company-${i}`}
                  placeholder="Company name"
                  value={exp.company}
                  onChange={e => { setExperience(ex => ex.map((x, j) => j === i ? { ...x, company: e.target.value } : x)); markDirty() }}
                />
                <Input
                  label="Role"
                  id={`exp-role-${i}`}
                  placeholder="Software Engineer Intern"
                  value={exp.role}
                  onChange={e => { setExperience(ex => ex.map((x, j) => j === i ? { ...x, role: e.target.value } : x)); markDirty() }}
                />
                <div className="space-y-1.5">
                  <label htmlFor={`exp-type-${i}`} className="block label-sm text-on-surface-muted">Employment Type</label>
                  <select
                    id={`exp-type-${i}`}
                    value={exp.employment_type}
                    onChange={e => { setExperience(ex => ex.map((x, j) => j === i ? { ...x, employment_type: e.target.value as ExperienceEntry['employment_type'] } : x)); markDirty() }}
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
                  id={`exp-start-${i}`}
                  type="month"
                  value={exp.start}
                  onChange={e => { setExperience(ex => ex.map((x, j) => j === i ? { ...x, start: e.target.value } : x)); markDirty() }}
                />
                <div className="space-y-1.5">
                  <label htmlFor={`exp-end-${i}`} className="block label-sm text-on-surface-muted">End Date</label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`exp-end-${i}`}
                      type="month"
                      value={exp.end ?? ''}
                      disabled={exp.end === null && exp.start !== ''}
                      onChange={e => { setExperience(ex => ex.map((x, j) => j === i ? { ...x, end: e.target.value || null } : x)); markDirty() }}
                      className="flex-1 bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-on-surface-muted whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.end === null}
                        onChange={e => { setExperience(ex => ex.map((x, j) => j === i ? { ...x, end: e.target.checked ? null : '' } : x)); markDirty() }}
                        className="w-3.5 h-3.5 rounded accent-primary"
                      />
                      Current
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor={`exp-bullets-${i}`} className="block label-sm text-on-surface-muted">Bullet Points (one per line)</label>
                <textarea
                  id={`exp-bullets-${i}`}
                  rows={3}
                  className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-muted/50 resize-none"
                  placeholder="Led development of...&#10;Improved performance by...&#10;Built and shipped..."
                  value={(exp.bullets ?? []).join('\n')}
                  onChange={e => { setExperience(ex => ex.map((x, j) => j === i ? { ...x, bullets: e.target.value.split('\n') } : x)); markDirty() }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  aria-label={`Remove experience at ${exp.company || 'entry'}`}
                  onClick={() => { setExperience(ex => ex.filter((_, j) => j !== i)); markDirty() }}
                  className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-error transition-colors"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setExperience(ex => [...ex, emptyExperience()]); markDirty() }}
          >
            + Add Experience
          </Button>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-4">
          {education.length === 0 && (
            <p className="text-sm text-on-surface-muted py-4">No education entries yet. Add your first one.</p>
          )}
          {education.map((edu, i) => (
            <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="School"
                  id={`edu-school-${i}`}
                  placeholder="University of..."
                  value={edu.school}
                  onChange={e => { setEducation(ed => ed.map((x, j) => j === i ? { ...x, school: e.target.value } : x)); markDirty() }}
                />
                <Input
                  label="Degree"
                  id={`edu-degree-${i}`}
                  placeholder="B.S. Computer Science"
                  value={edu.degree}
                  onChange={e => { setEducation(ed => ed.map((x, j) => j === i ? { ...x, degree: e.target.value } : x)); markDirty() }}
                />
                <Input
                  label="Major"
                  id={`edu-major-${i}`}
                  placeholder="Computer Science"
                  value={edu.major}
                  onChange={e => { setEducation(ed => ed.map((x, j) => j === i ? { ...x, major: e.target.value } : x)); markDirty() }}
                />
                <Input
                  label="GPA (optional)"
                  id={`edu-gpa-${i}`}
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  placeholder="3.8"
                  value={edu.gpa ?? ''}
                  onChange={e => { setEducation(ed => ed.map((x, j) => j === i ? { ...x, gpa: e.target.value ? Number(e.target.value) : undefined } : x)); markDirty() }}
                />
                <Input
                  label="Graduation Year"
                  id={`edu-year-${i}`}
                  type="number"
                  placeholder="2025"
                  value={edu.graduation_year}
                  onChange={e => { setEducation(ed => ed.map((x, j) => j === i ? { ...x, graduation_year: Number(e.target.value) } : x)); markDirty() }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  aria-label={`Remove education at ${edu.school || 'entry'}`}
                  onClick={() => { setEducation(ed => ed.filter((_, j) => j !== i)); markDirty() }}
                  className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-error transition-colors"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setEducation(ed => [...ed, emptyEducation()]); markDirty() }}
          >
            + Add Education
          </Button>
        </TabsContent>

        {/* Skills & Certs Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface">Skills</label>
            <TagInput
              value={skills}
              onChange={v => { setSkills(v); markDirty() }}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-on-surface">Certifications</label>
            {certifications.map((cert, i) => (
              <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Certification Name"
                    id={`cert-name-${i}`}
                    placeholder="AWS Solutions Architect"
                    value={cert.name}
                    onChange={e => { setCertifications(c => c.map((x, j) => j === i ? { ...x, name: e.target.value } : x)); markDirty() }}
                  />
                  <Input
                    label="Issuer"
                    id={`cert-issuer-${i}`}
                    placeholder="Amazon Web Services"
                    value={cert.issuer}
                    onChange={e => { setCertifications(c => c.map((x, j) => j === i ? { ...x, issuer: e.target.value } : x)); markDirty() }}
                  />
                  <Input
                    label="Date Issued (optional)"
                    id={`cert-date-${i}`}
                    type="month"
                    value={cert.date ?? ''}
                    onChange={e => { setCertifications(c => c.map((x, j) => j === i ? { ...x, date: e.target.value || null } : x)); markDirty() }}
                  />
                  <Input
                    label="Expiry (optional)"
                    id={`cert-expiry-${i}`}
                    type="month"
                    value={cert.expiry ?? ''}
                    onChange={e => { setCertifications(c => c.map((x, j) => j === i ? { ...x, expiry: e.target.value || null } : x)); markDirty() }}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    aria-label={`Remove certification ${cert.name || 'entry'}`}
                    onClick={() => { setCertifications(c => c.filter((_, j) => j !== i)); markDirty() }}
                    className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-error transition-colors"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setCertifications(c => [...c, emptyCertification()]); markDirty() }}
            >
              + Add Certification
            </Button>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-on-surface">Languages</label>
            {languages.map((lang, i) => (
              <div key={i} className="bg-surface-container rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Language"
                    id={`lang-name-${i}`}
                    placeholder="Spanish"
                    value={lang.language}
                    onChange={e => { setLanguages(l => l.map((x, j) => j === i ? { ...x, language: e.target.value } : x)); markDirty() }}
                  />
                  <div className="space-y-1.5">
                    <label htmlFor={`lang-prof-${i}`} className="block label-sm text-on-surface-muted">Proficiency</label>
                    <select
                      id={`lang-prof-${i}`}
                      value={lang.proficiency}
                      onChange={e => { setLanguages(l => l.map((x, j) => j === i ? { ...x, proficiency: e.target.value as LanguageEntry['proficiency'] } : x)); markDirty() }}
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
                    onClick={() => { setLanguages(l => l.filter((_, j) => j !== i)); markDirty() }}
                    className="flex items-center gap-1 text-xs text-on-surface-muted hover:text-error transition-colors"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setLanguages(l => [...l, emptyLanguage()]); markDirty() }}
            >
              + Add Language
            </Button>
          </div>
        </TabsContent>

        {/* EEO & Authorization Tab */}
        <TabsContent value="eeo" className="space-y-6">
          <p className="text-sm text-on-surface-muted">
            This information is encrypted and used only for auto-filling EEO sections of job applications.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="eeo-gender" className="block label-sm text-on-surface-muted">Gender</label>
              <select
                id="eeo-gender"
                value={eeoGender}
                onChange={e => { setEeoGender(e.target.value); markDirty() }}
                className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select...</option>
                {EEO_GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="eeo-race" className="block label-sm text-on-surface-muted">Race / Ethnicity</label>
              <select
                id="eeo-race"
                value={eeoRace}
                onChange={e => { setEeoRace(e.target.value); markDirty() }}
                className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select...</option>
                {EEO_RACES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="eeo-veteran" className="block label-sm text-on-surface-muted">Veteran Status</label>
              <select
                id="eeo-veteran"
                value={eeoVeteranStatus}
                onChange={e => { setEeoVeteranStatus(e.target.value); markDirty() }}
                className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select...</option>
                {EEO_VETERAN_STATUSES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="eeo-disability" className="block label-sm text-on-surface-muted">Disability Status</label>
              <select
                id="eeo-disability"
                value={eeoDisabilityStatus}
                onChange={e => { setEeoDisabilityStatus(e.target.value); markDirty() }}
                className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select...</option>
                {EEO_DISABILITY_STATUSES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="work-auth" className="block label-sm text-on-surface-muted">Work Authorization</label>
              <select
                id="work-auth"
                value={workAuthorization}
                onChange={e => { setWorkAuthorization(e.target.value); markDirty() }}
                className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select...</option>
                {WORK_AUTHORIZATIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block label-sm text-on-surface-muted">Sponsorship</label>
              <label className="flex items-center gap-2 cursor-pointer py-2.5">
                <input
                  type="checkbox"
                  checked={sponsorshipRequired}
                  onChange={e => { setSponsorshipRequired(e.target.checked); markDirty() }}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-on-surface">Will you now or in the future require sponsorship?</span>
              </label>
            </div>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <ResumeUploader
            profileId={profile.id}
            currentResumePath={resumePath}
            currentCoverLetterPath={coverLetterPath}
            onUploadComplete={handleUploadComplete}
          />
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="mt-8 flex items-center gap-4">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!isDirty || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
        {saveError && (
          <p className="text-sm text-error">{saveError}</p>
        )}
      </div>
    </div>
  )
}
