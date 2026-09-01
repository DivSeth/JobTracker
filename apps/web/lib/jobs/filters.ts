export function parseJobFilters(params: URLSearchParams) {
  const type = params.get('type')
  return { job_type: (type && type !== 'all') ? type : null }
}
