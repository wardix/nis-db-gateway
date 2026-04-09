import { SQL } from 'bun'

export const sql = new SQL({
  adapter: 'mysql',
  hostname: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nis',
})
