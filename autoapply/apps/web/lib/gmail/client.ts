export interface GmailMessage {
  id: string
  subject: string | null
  sender: string | null
  bodyPreview: string | null
  date: string | null
}

/** Fetch message headers + snippet from Gmail API */
export async function fetchMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) throw new Error(`Gmail fetch failed: ${res.status}`)
  const data = await res.json()

  const headers: Record<string, string> = {}
  for (const h of data.payload?.headers ?? []) {
    headers[h.name.toLowerCase()] = h.value
  }

  return {
    id: data.id,
    subject: headers['subject'] ?? null,
    sender: headers['from'] ?? null,
    bodyPreview: data.snippet ?? null,
    date: headers['date'] ?? null,
  }
}

/** Get new messages since a historyId */
export async function getHistoryMessages(
  accessToken: string,
  startHistoryId: string
): Promise<string[]> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`Gmail history failed: ${res.status}`)
  }

  const data = await res.json()
  const messageIds = new Set<string>()
  for (const h of data.history ?? []) {
    for (const m of h.messagesAdded ?? []) {
      messageIds.add(m.message.id)
    }
  }
  return Array.from(messageIds)
}

/** Register Gmail push notifications */
export async function registerWatch(
  accessToken: string,
  topicName: string
): Promise<{ historyId: string; expiration: string }> {
  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/watch',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicName,
        labelIds: ['INBOX'],
      }),
    }
  )

  if (!res.ok) throw new Error(`Watch registration failed: ${res.status}`)
  return res.json()
}
