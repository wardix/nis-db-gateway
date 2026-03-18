import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'
import { bearerAuth } from 'hono/bearer-auth'
import { SQL } from 'bun'

const app = new Hono()

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-me'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token'

// Use Bun's built-in SQL client for MySQL/MariaDB
// Bun automatically loads .env files, so no need for dotenv
const sql = new SQL({
  adapter: "mysql",
  hostname: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bandwidth_db",
})

app.get('/generate-token', bearerAuth({ token: ADMIN_TOKEN }), async (c) => {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expires in 1 hour
    role: 'api-client'
  }
  const token = await sign(payload, JWT_SECRET)
  return c.json({ token, expires_in: '1h' })
})

app.post('/lookup-bandwidth', jwt({ secret: JWT_SECRET, alg: 'HS256' }), async (c) => {
  try {
    const body = await c.req.json();
    const ips = body.ips;
    
    if (!Array.isArray(ips) || ips.length === 0) {
      return c.json({ error: 'ips must be a non-empty array of strings' }, 400);
    }

    const networks = ips.map((ip: string) => `${ip}/32`);

    const BATCH_SIZE = 500;
    
    // Split networks into batches of BATCH_SIZE
    const batches = [];
    for (let i = 0; i < networks.length; i += BATCH_SIZE) {
      batches.push(networks.slice(i, i + BATCH_SIZE));
    }

    // Process all batches in parallel
    const queryResults = await Promise.all(
      batches.map(batch => sql`
        SELECT 
            cst.Network AS network, 
            (ss.NormalDownCeil * 1000) AS download_rate, 
            (ss.NormalUpCeil * 1000) AS upload_rate, 
            'bps' AS unit, 
            cs.ServiceId AS subscription_package 
        FROM 
            CustomerServiceTechnical AS cst 
        LEFT JOIN 
            CustomerServices AS cs ON cs.CustServId = cst.CustServId 
        LEFT JOIN 
            ServiceShaping AS ss ON cs.ServiceId = ss.ServiceId 
        WHERE 
            cst.Network IN ${sql(batch)}
      `)
    );

    // Flatten results from all batches and map 'network' back to 'ip' by removing '/32'
    const flattenedResults = queryResults.flat().map((row: any) => ({
      ip: row.network.replace('/32', ''),
      download_rate: row.download_rate,
      upload_rate: row.upload_rate,
      unit: row.unit,
      subscription_package: row.subscription_package
    }));

    return c.json(flattenedResults);
  } catch (error: any) {
    console.error('Database error:', error);
    
    // Check for common connection errors
    if (error.code === 'ECONNREFUSED') {
      return c.json({ error: 'Database connection failed' }, 500);
    }
    
    return c.json({ error: 'An unexpected error occurred' }, 500);
  }
})

export default {
  port: 3000,
  fetch: app.fetch,
}
