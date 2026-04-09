import { sql } from '../config/db'

export const customerRepository = {
  async findByEmail(email: string) {
    return await sql`
      SELECT
        CustId as customer_id
      FROM
        Customer
      WHERE
        (FIND_IN_SET(${email}, CustEmail) > 0) OR
        (FIND_IN_SET(${email}, CustTechCPEmail) > 0) OR
        (FIND_IN_SET(${email}, CustBillCPEmail) > 0)
    `
  },
}
