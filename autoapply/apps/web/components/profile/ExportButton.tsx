'use client'

export function ExportButton() {
  async function handleExport() {
    const res = await fetch('/api/profile/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'autoapply-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button
      onClick={handleExport}
      className="px-4 py-1.5 border border-white/10 hover:bg-white/5 transition-all rounded text-[10px] font-semibold text-white uppercase tracking-widest flex items-center gap-2"
    >
      <span className="material-symbols-outlined text-[16px]">file_download</span>
      Export Data
    </button>
  )
}
