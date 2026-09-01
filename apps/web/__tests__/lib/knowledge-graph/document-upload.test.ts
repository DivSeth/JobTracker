import { describe, expect, it } from 'vitest'

import { extractTextFromKnowledgeUpload } from '@/lib/knowledge-graph/document-upload'

function pdfFixture(text: string): File {
  const stream = `BT /F1 18 Tf 72 720 Td (${text}) Tj ET`
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${stream.length} >> stream
${stream}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 1 0 R >>
%%EOF
`

  return new File([pdf], 'resume.pdf', { type: 'application/pdf' })
}

describe('extractTextFromKnowledgeUpload', () => {
  it('extracts readable text and metadata from uploaded PDFs', async () => {
    const result = await extractTextFromKnowledgeUpload(pdfFixture(
      'Built AutoApply OS with Next Supabase Qwen embeddings and document ingestion workflows.'
    ))

    expect(result.rawText).toContain('Built AutoApply OS')
    expect(result.metadata).toMatchObject({
      original_filename: 'resume.pdf',
      content_type: 'application/pdf',
      upload_method: 'document_upload',
      extracted_format: 'pdf',
    })
  })
})
