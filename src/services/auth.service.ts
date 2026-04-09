import { sign } from 'hono/jwt'
import { JWT_SECRET } from '../config/auth'

export const authService = {
  async generateToken(payload: { role: string; user: string; exp?: number }) {
    return await sign(payload, JWT_SECRET)
  },
}
