import type { ResumeStrategyPreviewData } from '@/lib/resume-strategy/planner'

function escapeTex(value: string): string {
  return value
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
}

export function buildResumeDraftTex(preview: ResumeStrategyPreviewData): string {
  const focusItems = preview.focus.map((item) => `  \\item ${escapeTex(item)}`).join('\n')
  const claimItems = preview.selectedClaims
    .map((claim) => `  \\item ${escapeTex(claim.claim)} % claim_id=${claim.id}`)
    .join('\n')
  const overclaimRules = preview.overclaimRules
    .map((rule) => `% - ${rule}`)
    .join('\n')

  return `% AutoApply generated resume draft
% Status: review required before use
% Job analysis: ${preview.jobAnalysisId}
% Role archetype: ${preview.roleArchetypeKey}

\\section*{Target Role}
${escapeTex(preview.headline)}

\\section*{Positioning Focus}
\\begin{itemize}
${focusItems || '  \\item Evidence-backed role fit'}
\\end{itemize}

\\section*{Candidate Evidence Bullets}
\\begin{itemize}
${claimItems || '  \\item Add approved, resume-usable claims before generating a final resume.'}
\\end{itemize}

% Overclaim guardrails
${overclaimRules || '% - No claim-specific guardrails recorded yet.'}
`
}
