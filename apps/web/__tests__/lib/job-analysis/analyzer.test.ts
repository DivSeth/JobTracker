import { describe, expect, it } from 'vitest'
import { analyzePastedJob, classifyRoleArchetype, extractTechStack } from '@/lib/job-analysis/analyzer'

describe('classifyRoleArchetype', () => {
  it('classifies backend/platform reliability roles', () => {
    expect(
      classifyRoleArchetype(`
        Staff Backend Engineer, Platform
        Build distributed services, queues, observability, reliability, APIs, and cloud systems.
      `)
    ).toBe('backend')
  })

  it('classifies quant C++ trading systems roles', () => {
    expect(
      classifyRoleArchetype(`
        Quantitative Software Engineer
        C++ matching engine, low latency systems, market data, order books, and trading infrastructure.
      `)
    ).toBe('quant_swe')
  })

  it('classifies AI platform roles separately from generic AI/ML', () => {
    expect(
      classifyRoleArchetype(`
        AI Platform Engineer
        Build LLM evaluation pipelines, vector retrieval, model serving, agent infrastructure, and RAG systems.
      `)
    ).toBe('ai_platform')
  })
})

describe('extractTechStack', () => {
  it('extracts normalized technologies from a job description', () => {
    expect(
      extractTechStack('We use TypeScript, React, Next.js, Postgres, Redis, Python, AWS, Kubernetes, and C++.')
    ).toEqual(['typescript', 'react', 'next.js', 'postgres', 'redis', 'python', 'aws', 'kubernetes', 'c++'])
  })
})

describe('analyzePastedJob', () => {
  it('builds a structured job analysis from pasted job text', () => {
    const analysis = analyzePastedJob({
      jobText: `
        Software Engineer, Full Stack
        Nooks
        We are hiring a product-minded engineer to build React, TypeScript, Node, and Postgres workflows.
        You will ship customer-facing features, work with LLM agents, improve reliability, and collaborate with design.
        Requirements:
        2+ years building full-stack products
        Experience with React and backend APIs
      `,
      applyUrl: 'https://jobs.example.com/nooks/full-stack',
    })

    expect(analysis).toMatchObject({
      title: 'Software Engineer, Full Stack',
      company_name: 'Nooks',
      normalized_company: 'nooks',
      role_archetype_key: 'full_stack',
      seniority: 'mid',
      apply_url: 'https://jobs.example.com/nooks/full-stack',
    })
    expect(analysis.tech_stack).toEqual(['typescript', 'react', 'postgres', 'node'])
    expect(analysis.requirements).toContain('2+ years building full-stack products')
    expect(analysis.hidden_priorities).toContain('product ownership')
    expect(analysis.strategy.focus).toContain('full-stack product delivery')
    expect(analysis.fit_score).toBeGreaterThan(0)
  })

  it('uses explicit company and title inputs when supplied', () => {
    const analysis = analyzePastedJob({
      jobText: 'Build backend services with Go, Kafka, Kubernetes, and observability.',
      companyName: 'Samsara, Inc.',
      jobTitle: 'Backend Software Engineer',
    })

    expect(analysis.company_name).toBe('Samsara, Inc.')
    expect(analysis.normalized_company).toBe('samsara')
    expect(analysis.title).toBe('Backend Software Engineer')
    expect(analysis.role_archetype_key).toBe('backend')
  })

  it('uses Ashby URL company slug and full-stack title signals instead of layout labels', () => {
    const analysis = analyzePastedJob({
      applyUrl: 'https://jobs.ashbyhq.com/netic/bab5d1e5-e31b-42f0-9cef-334b1f17fed3?source=LI',
      jobText: `
        Full-Stack Software Engineer (Product) - New Grad - 2026-2027
        Location

        San Francisco

        Employment Type

        Full time

        Location Type

        On-site

        Department

        University

        Overview
        Application

        Netic is the AI revenue engine for essential services.
        Netic's Full-Stack Software Engineers working on the product team build the features that put AI in the hands of real businesses.
        Build agentic products: Design, code, and ship full-stack features for Netic's AI platform.
        Own end-to-end delivery, handling data models, APIs, front-end polish, and post-launch iteration.
        Full-stack fluency: Comfortable with React, TypeScript, Python; experience with databases and cloud infrastructure.
      `,
    })

    expect(analysis).toMatchObject({
      title: 'Full-Stack Software Engineer (Product) - New Grad - 2026-2027',
      company_name: 'Netic',
      normalized_company: 'netic',
      role_archetype_key: 'full_stack',
      seniority: 'junior',
    })
    expect(analysis.strategy.focus).toContain('full-stack product delivery')
  })
})
