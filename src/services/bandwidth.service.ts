import { bandwidthRepository } from '../repositories/bandwidth.repository'

export const bandwidthService = {
  async searchBandwidth(ips: string[]) {
    const networks = ips.map((ip) => `${ip}/32`)
    const results = await bandwidthRepository.searchByNetworks(networks)

    return results.map((row) => ({
      ip: row.network.replace('/32', ''),
      download_rate: row.download_rate,
      upload_rate: row.upload_rate,
      unit: row.unit,
      subscription_package: row.subscription_package,
    }))
  },
}
