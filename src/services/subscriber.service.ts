import { subscriberRepository } from '../repositories/subscriber.repository'

export const subscriberService = {
  async lookupByPhone(phone: string) {
    return await subscriberRepository.findByPhone(phone)
  },

  async syncGraphs(data: { subscriber_id: string; graph_id: string }[], updatedBy: string) {
    return await subscriberRepository.syncGraphs(data, updatedBy)
  },
}
