import { sql } from '../config/db'

export interface BandwidthResult {
  network: string
  download_rate: number
  upload_rate: number
  unit: string
  subscription_package: string
}

export const bandwidthRepository = {
  async searchByNetworks(networks: string[]): Promise<BandwidthResult[]> {
    const BATCH_SIZE = 500
    const batches = []
    for (let i = 0; i < networks.length; i += BATCH_SIZE) {
      batches.push(networks.slice(i, i + BATCH_SIZE))
    }

    const queryResults = await Promise.all(
      batches.map(
        (batch) => sql`
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
          Services AS s ON cs.ServiceId = s.ServiceId
      LEFT JOIN
          ServiceShaping AS ss ON cs.ServiceId = ss.ServiceId
      WHERE
          NOT (s.ServiceGroup IN ('SLBP', 'MT', 'IP'))
          AND cst.Network IN ${sql(batch)}
    `,
      ),
    )

    return queryResults.flat() as BandwidthResult[]
  },
}
