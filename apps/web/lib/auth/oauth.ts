export function resolveWebAppOrigin({
  configuredOrigin,
  browserOrigin,
}: {
  configuredOrigin?: string
  browserOrigin: string
}): string {
  return configuredOrigin?.replace(/\/$/, '') || browserOrigin
}

export function buildOAuthRedirectTo({
  configuredOrigin,
  browserOrigin,
  source,
}: {
  configuredOrigin?: string
  browserOrigin: string
  source: string | null
}): string {
  const origin = resolveWebAppOrigin({ configuredOrigin, browserOrigin })
  const extensionSuffix = source === 'extension' ? '?source=extension' : ''

  return `${origin}/api/auth/callback${extensionSuffix}`
}
