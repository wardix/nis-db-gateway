import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { JWT_SECRET } from '../config/auth'
import { bandwidthService } from '../services/bandwidth.service'

const bandwidth = new Hono()

bandwidth.post(
  '/search',
  jwt({ secret: JWT_SECRET, alg: 'HS256' }),
  async (c) => {
    try {
      const body = await c.req.json()
      const ips = body.ips

      if (!Array.isArray(ips) || ips.length === 0) {
        return c.json(
          { error: 'ips must be a non-empty array of strings' },
          400,
        )
      }

      const results = await bandwidthService.searchBandwidth(ips)
      return c.json(results)
    } catch (error: unknown) {
      console.error('Database error:', error)

      const err = error as { code?: string }

      if (err.code === 'ECONNREFUSED') {
        return c.json({ error: 'Database connection failed' }, 500)
      }

      return c.json({ error: 'An unexpected error occurred' }, 500)
    }
  },
)

export default bandwidth
