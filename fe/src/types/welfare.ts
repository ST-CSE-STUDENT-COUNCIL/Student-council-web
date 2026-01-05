export type RentalRequest = {
    rental_id: number
    rental_end_date: string
}

export type RentalItem = {
    id: number
    item_name?: string
}

export type Locker = {
    locker_number: number
    period_id?: number
}

export type LockerPeriod = {
    id: number
    usage_start: string
    usage_end: string
}
