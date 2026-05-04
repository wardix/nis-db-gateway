import { subscriberRepository } from '../repositories/subscriber.repository'

export const subscriberService = {
  async lookupByPhone(phone: string) {
    return await subscriberRepository.findByPhone(phone)
  },

  async syncGraphs(data: { subscriber_id: string; graph_id: string }[], updatedBy: string) {
    return await subscriberRepository.syncGraphs(data, updatedBy)
  },

  async getPaginatedFttxCircuits(page: number, pageSize: number, operatorId?: string) {
    const { results, total } = await subscriberRepository.getFttxCircuitsPaginated(page, pageSize, operatorId)
    const totalPages = Math.ceil(total / pageSize)

    return {
      results,
      next_page: page < totalPages ? page + 1 : null,
      total_pages: totalPages,
    }
  },
}
