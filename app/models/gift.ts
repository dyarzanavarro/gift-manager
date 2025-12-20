export type GiftStatus = 'idea' | 'planned' | 'bought'

export interface GiftIdea {
    id: number
    personId: number
    title: string
    notes?: string
    occasionId: number
    status: GiftStatus
    link?: string
    imageUrl?: string
}