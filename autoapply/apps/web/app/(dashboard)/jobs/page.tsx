'use client'
import { useState, useEffect } from 'react'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFilters, type FilterTab } from '@/components/jobs/JobFilters'
import type { JobWithScore } from '@/lib/types'

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithScore[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/jobs?type=${filter}`)
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false) })
  }, [filter])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <span className="text-muted-foreground text-sm">{jobs.length} listings</span>
      </div>
      <JobFilters active={filter} onChange={setFilter} />
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          No jobs found. Try triggering a sync or changing filters.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  )
}
