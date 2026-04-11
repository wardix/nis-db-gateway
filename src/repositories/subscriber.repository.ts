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

  async syncGraphs(data: { subscriber_id: string; graph_id: string }[], updatedBy: string) {
    // Perform batch insert with IGNORE into the real table CustomerServicesZabbixGraph
    // Unique key (CustServId, GraphId) ensures we skip existing pairs
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    const subscriberGraphData = data.map((item) => ({
      CustServId: item.subscriber_id,
      GraphId: item.graph_id,
      OrderNo: 1,      // OrderNo default to 1
      UpdatedTime: now,// UpdatedTime
      updatedBy        // UpdatedBy from JWT user
    }))

    return await sql`
      INSERT IGNORE INTO CustomerServicesZabbixGraph
      ${sql(subscriberGraphData)}
    `
  },
}
