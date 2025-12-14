import { mockGifts } from '~/data/mockGifts'
import type { GiftIdea, GiftStatus } from '~/models/gift'

export const useGifts = () => {
    const gifts = useState<GiftIdea[]>('gifts', () => [...mockGifts])

    const nextId = computed(
        () => (gifts.value.length ? Math.max(...gifts.value.map(g => g.id)) + 1 : 1)
    )

    const addGift = (payload: Omit<GiftIdea, 'id'>) => {
        gifts.value.push({
            id: nextId.value,
            ...payload
        })
    }

    return {
        gifts,
        addGift
    }



}