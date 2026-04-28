import { eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { seedDefaultActivities } from '~~/server/utils/seed'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile', 'openid']
  },
  async onSuccess(event, { user }) {
    const db = useDb()
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.googleId, user.sub))

    let userId: number
    let chimeSound: string
    if (existing) {
      userId = existing.id
      chimeSound = existing.chimeSound
      await db.update(schema.users)
        .set({ email: user.email, name: user.name, avatarUrl: user.picture ?? null })
        .where(eq(schema.users.id, userId))
    } else {
      const [inserted] = await db.insert(schema.users).values({
        googleId: user.sub,
        email: user.email,
        name: user.name,
        avatarUrl: user.picture ?? null
      }).returning({ id: schema.users.id, chimeSound: schema.users.chimeSound })
      userId = inserted!.id
      chimeSound = inserted!.chimeSound
      await seedDefaultActivities(userId)
    }

    await setUserSession(event, {
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        avatarUrl: user.picture ?? null,
        chimeSound
      },
      loggedInAt: Date.now()
    })

    const nativeAuth = getCookie(event, 'menubar_auth') === '1'
      ? { scheme: 'blocks-menubar', cookie: 'menubar_auth', errorTag: 'menubar' }
      : getCookie(event, 'mobile_auth') === '1'
        ? { scheme: 'blocks-mobile', cookie: 'mobile_auth', errorTag: 'mobile' }
        : null

    if (nativeAuth) {
      deleteCookie(event, nativeAuth.cookie)
      const raw = getResponseHeader(event, 'set-cookie')
      const headers = (Array.isArray(raw) ? raw : raw ? [raw] : []) as string[]
      const entry = headers.find(h => h.startsWith('nuxt-session='))
      if (entry) {
        const value = entry.split(';')[0]!.slice('nuxt-session='.length)
        return sendRedirect(event, `${nativeAuth.scheme}://auth/callback?session=${encodeURIComponent(value)}`)
      }
      return sendRedirect(event, `/login?error=${nativeAuth.errorTag}`)
    }

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth')
  }
})
