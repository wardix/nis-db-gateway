import { subscriberRepository } from '../repositories/subscriber.repository'

export const subscriberService = {
  async lookupByPhone(phone: string) {
    return await subscriberRepository.findByPhone(phone)
  },
}
