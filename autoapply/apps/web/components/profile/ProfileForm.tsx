'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/lib/types'

interface Props {
  initialData?: Partial<Profile>
  onSubmit: (data: Partial<Profile>) => Promise<void>
}

export function ProfileForm({ initialData, onSubmit }: Props) {
  const [skills, setSkills] = useState(
    initialData?.skills?.join(', ') ?? ''
  )
  const [remoteOk, setRemoteOk] = useState(
    initialData?.preferences?.remote_ok ?? true
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit({
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      preferences: {
        job_types: initialData?.preferences?.job_types ?? ['new_grad', 'internship'],
        locations: initialData?.preferences?.locations ?? [],
        remote_ok: remoteOk,
        min_salary: initialData?.preferences?.min_salary ?? null,
      },
      education: initialData?.education ?? [],
      experience: initialData?.experience ?? [],
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          value={skills}
          onChange={e => setSkills(e.target.value)}
          placeholder="React, TypeScript, Python, SQL..."
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="remote_ok"
          checked={remoteOk}
          onChange={e => setRemoteOk(e.target.checked)}
        />
        <Label htmlFor="remote_ok">Open to remote</Label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  )
}
