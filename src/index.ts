import { Hono } from 'hono'
import auth from './routes/auth.route'
import bandwidth from './routes/bandwidth.route'
import customers from './routes/customer.route'
import subscribers from './routes/subscriber.route'

const app = new Hono()

// Mount routes
app.route('/auth', auth)
app.route('/bandwidth', bandwidth)
app.route('/customers', customers)
app.route('/subscribers', subscribers)

Bun.serve({
  port: parseInt(process.env.PORT || '3000', 10),
  fetch: app.fetch,
})
