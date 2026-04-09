import { customerRepository } from '../repositories/customer.repository'

export const customerService = {
  async lookupByEmail(email: string) {
    return await customerRepository.findByEmail(email)
  },
}
