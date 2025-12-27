export type GiftStatus = 'idea' | 'planned' | 'bought' | 'given';

export interface GiftIdea {
    id: number
    userId?: string
    personId: number
    occasionId: number
    title: string
    notes?: string | null
    status: GiftStatus
    link?: string | null
    imageUrl?: string | null
    createdAt?: string
}