export type OccasionType = 'birthday' | 'christmas' | 'custom'
export interface Occasion {
    id: number
    name: string
    type: OccasionType
}