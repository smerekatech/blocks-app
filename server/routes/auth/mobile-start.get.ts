export default defineEventHandler((event) => {
  setCookie(event, 'mobile_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 300
  })
  return sendRedirect(event, '/auth/google')
})
