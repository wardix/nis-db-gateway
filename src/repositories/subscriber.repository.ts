import { sql } from '../config/db'

export const subscriberRepository = {
  async findByPhone(phone: string) {
    return await sql`
      SELECT
        cs.CustServId AS subscriber_id,
        cs.CustAccName AS account_name
      FROM
        sms_phonebook AS sp
      LEFT JOIN
        CustomerServices cs
      ON sp.CustId = cs.CustId
      WHERE
        CONCAT('+', sp.phone) LIKE CONCAT('%+', ${phone})
        AND NOT (cs.CustStatus IN ('NA'))
    `
  },
}
