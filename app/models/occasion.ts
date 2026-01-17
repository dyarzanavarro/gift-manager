export type OccasionType = 'birthday' | 'christmas' | 'custom'

export interface Occasion {
    id: string
    userId?: string
    name: string
    type: OccasionType
    createdAt?: string
}
