export interface BookingReviewServiceInput {
  id: string
  name: string
  price: number
  durationMinutes: number
}

export interface BookingReviewProductInput {
  id: string
  name: string
  price: number
}

export interface BookingReviewPackageInput {
  id: string
  name: string
  price: number
  durationMinutes: number
  services: string[]
  serviceDurations?: number[]
}

export interface BookingReviewInput {
  clientName: string
  clientPhone: string
  date: string
  time: string
  paymentMethod: string
  package: BookingReviewPackageInput | null
  services: BookingReviewServiceInput[]
  products: BookingReviewProductInput[]
}

export function buildBookingReview(input: BookingReviewInput) {
  const items = [
    ...(input.package ? [{ id: input.package.id, type: 'package' as const, name: input.package.name, price: input.package.price, durationMinutes: input.package.durationMinutes }] : []),
    ...input.services.map((service) => ({ id: service.id, type: 'service' as const, name: service.name, price: service.price, durationMinutes: service.durationMinutes })),
    ...input.products.map((product) => ({ id: product.id, type: 'product' as const, name: product.name, price: product.price, durationMinutes: 0 })),
  ]
  const packageDuration = input.package
    ? input.package.durationMinutes || (input.package.serviceDurations || []).reduce((total, duration) => total + duration, 0)
    : 0
  const selectedDuration = packageDuration + input.services.reduce((total, service) => total + service.durationMinutes, 0)

  return {
    clientName: input.clientName,
    clientPhone: input.clientPhone,
    date: input.date,
    time: input.time,
    paymentMethod: input.paymentMethod,
    packageServices: input.package?.services || [],
    items,
    totalPrice: items.reduce((total, item) => total + item.price, 0),
    totalDurationMinutes: selectedDuration || (input.products.length > 0 ? 30 : 0),
  }
}
