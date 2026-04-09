import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { ADMIN_TOKEN } from '../config/auth'
import { authService } from '../services/auth.service'

const auth = new Hono()

auth.post('/token', bearerAuth({ token: ADMIN_TOKEN }), async (c) => {
  let body: { role?: string; exp?: number; user?: string } = {}
  try {
    body = await c.req.json()
  } catch {
    body = {}
  }

  const role = body.role || 'operator'
  const user = body.user || 'nis'
  const expSeconds = body.exp

  const payload: { role: string; user: string; exp?: number } = {
    role,
    user,
  }

  if (expSeconds && !Number.isNaN(Number(expSeconds))) {
    payload.exp = Math.floor(Date.now() / 1000) + Number(expSeconds)
  }

  const token = await authService.generateToken(payload)
  return c.json({
    token,
    ...(payload.exp
      ? { expires_in: `${expSeconds}s` }
      : { expires_in: 'never' }),
  })
})

export default auth
