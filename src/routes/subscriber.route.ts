import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { JWT_SECRET } from '../config/auth'
import { subscriberService } from '../services/subscriber.service'

const subscribers = new Hono()

subscribers.get(
  '/lookup',
  jwt({ secret: JWT_SECRET, alg: 'HS256' }),
  async (c) => {
    try {
      const phone = c.req.query('phone')

      if (!phone) {
        return c.json({ error: 'phone query parameter is required' }, 400)
      }

      const results = await subscriberService.lookupByPhone(phone)

      if (results.length === 0) {
        return c.json({ error: 'Subscriber not found' }, 404)
      }

      return c.json(results)
    } catch (error: unknown) {
      console.error('Database error:', error)
      return c.json({ error: 'An unexpected error occurred' }, 500)
    }
  },
)

subscribers.post(
  '/graph/sync',
  jwt({ secret: JWT_SECRET, alg: 'HS256' }),
  async (c) => {
    try {
      const body = await c.req.json()
      const data = body.data
      const payload = c.get('jwtPayload')
      const updatedBy = payload.user || 'api'

      if (!Array.isArray(data) || data.length === 0) {
        return c.json(
          { error: 'data must be a non-empty array of objects' },
          400,
        )
      }

      await subscriberService.syncGraphs(data, updatedBy)

      return c.json({ message: 'Sync successful', processed: data.length })
    } catch (error: unknown) {
      console.error('Database error:', error)
      return c.json({ error: 'An unexpected error occurred' }, 500)
    }
  },
)

export default subscribers
