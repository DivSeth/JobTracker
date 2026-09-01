import { ensurePdfNodeCanvasGlobals } from '@/lib/pdf/node-canvas-polyfill'

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

const TEXT_CONTENT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/markdown',
])

export class KnowledgeUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'KnowledgeUploadError'
  }
}

function extensionFor(fileName: string): string {
  return fileName.toLowerCase().split('.').pop() ?? ''
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  await ensurePdfNodeCanvasGlobals()
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()
    return result.text.trim()
  } catch (err) {
    throw new KnowledgeUploadError(
      `Could not extract text from PDF: ${err instanceof Error ? err.message : 'unknown parser error'}`
    )
  } finally {
    await parser.destroy()
  }
}

export async function extractTextFromKnowledgeUpload(file: File): Promise<{
  rawText: string
  metadata: {
    original_filename: string
    content_type: string
    byte_size: number
    upload_method: 'document_upload'
    extracted_format: 'pdf' | 'text'
  }
}> {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new KnowledgeUploadError('Document file exceeds 10MB limit.')
  }

  const ext = extensionFor(file.name)
  const contentType = file.type || 'application/octet-stream'

  let rawText = ''
  let extractedFormat: 'pdf' | 'text'

  if (contentType === 'application/pdf' || ext === 'pdf') {
    const buffer = Buffer.from(await file.arrayBuffer())
    rawText = await extractTextFromPdf(buffer)
    extractedFormat = 'pdf'
  } else if (TEXT_CONTENT_TYPES.has(contentType) || ext === 'txt' || ext === 'md') {
    rawText = await file.text()
    rawText = rawText.trim()
    extractedFormat = 'text'
  } else {
    throw new KnowledgeUploadError('Unsupported document type. Upload a PDF, .txt, or .md file.')
  }

  if (rawText.trim().length < 40) {
    throw new KnowledgeUploadError('Could not extract enough text from the uploaded document.')
  }

  return {
    rawText,
    metadata: {
      original_filename: file.name,
      content_type: contentType,
      byte_size: file.size,
      upload_method: 'document_upload',
      extracted_format: extractedFormat,
    },
  }
}
