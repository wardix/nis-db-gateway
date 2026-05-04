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

  async getFttxCircuitsPaginated(page: number, pageSize: number, operatorId?: string) {
    const offset = (page - 1) * pageSize

    const baseQuery = sql`
      FROM CustomerServiceTechnicalCustom cstc
      LEFT JOIN CustomerServiceTechnicalLink cstl ON cstl.id = cstc.technicalTypeId
      LEFT JOIN CustomerServices cs ON cs.CustServId = cstl.CustServId
      LEFT JOIN Customer c ON c.CustId = cs.CustId
      LEFT JOIN noc_fiber nf ON nf.id = cstl.foVendorId
      LEFT JOIN fiber_vendor fv ON nf.vendorId = fv.id
      WHERE
          cstc.technicalType = 'link'
          AND cstc.attribute = 'Vendor CID'
          AND cstl.CustServId IS NOT NULL
          AND cs.CustStatus NOT IN ('NA')
          ${operatorId ? sql`AND fv.id = ${operatorId}` : sql``}
          AND cstc.value <> ''
    `

    const [results, totalCount] = await Promise.all([
      sql`
        SELECT
            cstl.CustServId AS subscriber_id,
            cs.CustAccName AS subscriber_name,
            cstc.value AS circuit_id
        ${baseQuery}
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as total
        ${baseQuery}
      `,
    ])

    return {
      results,
      total: (totalCount[0] as { total: number }).total,
    }
  },
}
