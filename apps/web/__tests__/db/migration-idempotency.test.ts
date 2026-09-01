import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const rootMigrationsPath = join(process.cwd(), '../../supabase/migrations')

describe('database migrations', () => {
  it('creates indexes idempotently so partially applied schemas can recover', () => {
    const offenders = readdirSync(rootMigrationsPath)
      .filter((file) => file.endsWith('.sql'))
      .flatMap((file) => {
        const sql = readFileSync(join(rootMigrationsPath, file), 'utf8')

        return Array.from(sql.matchAll(/^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS)(\S+)/gim))
          .map((match) => `${file}: ${match[0].trim()}`)
      })

    expect(offenders).toEqual([])
  })
})
