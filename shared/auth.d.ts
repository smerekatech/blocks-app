declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    name: string
    avatarUrl: string | null
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
