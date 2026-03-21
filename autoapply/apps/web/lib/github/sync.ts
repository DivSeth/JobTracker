export interface ParsedJobRow {
  company: string
  title: string
  location: string | null
  apply_url: string | null
  is_active: boolean
}

/**
 * Returns lines from a git diff that represent new additions (+| lines).
 * Strips the leading '+' character.
 */
export function parseAddedMarkdownRows(diff: string): string[] {
  return diff
    .split('\n')
    .filter(line => line.startsWith('+|'))
    .map(line => line.slice(1))
}

/**
 * Returns false for closed/expired roles (strikethrough ~~ or lock 🔒).
 */
export function isJobActive(row: string): boolean {
  return !row.includes('~~') && !row.includes('🔒')
}

/**
 * Parses a SimplifyJobs markdown table row into structured data.
 * Returns null for header, separator, or malformed rows.
 */
export function regexParseJobRow(row: string): ParsedJobRow | null {
  // Skip separator and header rows
  if (row.includes('---')) return null
  if (/\|\s*Company\s*\|/i.test(row)) return null

  const cells = row.split('|').map(c => c.trim()).filter(Boolean)
  if (cells.length < 3) return null

  const company = cells[0].replace(/~~/g, '').trim()
  const title   = cells[1].replace(/~~/g, '').trim()
  const location = cells[2].replace(/~~/g, '').trim() || null

  // Extract href from <a href="...">
  const urlMatch = cells[3]?.match(/href="([^"]+)"/)
  const apply_url = urlMatch ? urlMatch[1] : null

  if (!company || company === '---') return null

  return { company, title, location, apply_url, is_active: isJobActive(row) }
}

/**
 * Fetches the latest commit SHA for a GitHub repo's default branch.
 */
export async function getLatestCommitSha(
  repoName: string,
  token: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${repoName}/commits?per_page=1`,
    { headers: { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } }
  )
  const data = await res.json()
  return data[0].sha
}

/**
 * Fetches diff between two SHAs. On first sync (baseSha null), returns
 * full file content with all rows prefixed as additions.
 */
export async function getRepoDiff(
  repoName: string,
  baseSha: string | null,
  headSha: string,
  token: string
): Promise<string> {
  if (!baseSha) {
    // First sync — treat all rows as new
    const res = await fetch(
      `https://api.github.com/repos/${repoName}/contents/README.md?ref=${headSha}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw' } }
    )
    const content = await res.text()
    return content.split('\n').map(l => l.startsWith('|') ? `+${l}` : l).join('\n')
  }

  const res = await fetch(
    `https://api.github.com/repos/${repoName}/compare/${baseSha}...${headSha}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.diff' } }
  )
  return res.text()
}
