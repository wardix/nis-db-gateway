import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { JWT_SECRET } from '../config/auth'
import { customerService } from '../services/customer.service'

const customers = new Hono()

customers.get(
  '/lookup',
  jwt({ secret: JWT_SECRET, alg: 'HS256' }),
  async (c) => {
    try {
      const email = c.req.query('email')

      if (!email) {
        return c.json({ error: 'email query parameter is required' }, 400)
      }

      const results = await customerService.lookupByEmail(email)

      if (results.length === 0) {
        return c.json({ error: 'Customer not found' }, 404)
      }

      return c.json(results)
    } catch (error: unknown) {
      console.error('Database error:', error)
      return c.json({ error: 'An unexpected error occurred' }, 500)
    }
  },
)

export default customers
