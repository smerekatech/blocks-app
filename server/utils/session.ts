import type { H3Event } from 'h3'

export async function requireUserId(event: H3Event): Promise<number> {
  const { user } = await requireUserSession(event)
  return user.id
}
