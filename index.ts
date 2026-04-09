import { Hono } from 'hono'
import auth from './src/routes/auth.route'
import bandwidth from './src/routes/bandwidth.route'
import customers from './src/routes/customer.route'
import subscribers from './src/routes/subscriber.route'

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
