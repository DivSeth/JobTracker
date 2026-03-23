'use client'
import { useState, KeyboardEvent } from 'react'

const SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'C++', 'C#', 'Rust',
  'Node.js', 'Next.js', 'Vue', 'Angular', 'Svelte', 'SQL', 'PostgreSQL', 'MongoDB',
  'Redis', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Git', 'Linux', 'GraphQL',
  'REST', 'gRPC', 'Terraform', 'CI/CD', 'Machine Learning', 'PyTorch', 'TensorFlow',
  'Pandas', 'NumPy', 'R', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'Figma',
  'HTML', 'CSS', 'Tailwind CSS', 'Express', 'FastAPI', 'Django', 'Spring Boot',
  'Scala', 'Haskell', 'MATLAB', 'Julia', 'Bash', 'PowerShell',
]

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ value, onChange, placeholder = 'Add skill...' }: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.replace(/,/g, '').trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 bg-surface-card rounded-xl px-3 py-2 min-h-[42px] focus-within:ring-2 focus-within:ring-primary/20">
      {value.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter(t => t !== tag))}
            className="hover:text-error transition-colors leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        list="skill-suggestions"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-muted/50"
      />
      <datalist id="skill-suggestions">
        {SKILL_SUGGESTIONS.map(s => <option key={s} value={s} />)}
      </datalist>
    </div>
  )
}
