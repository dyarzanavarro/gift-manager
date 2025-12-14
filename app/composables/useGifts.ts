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

    const updateGift = (id: number, payload: Omit<GiftIdea, 'id'>) => {
        const index = gifts.value.findIndex(g => g.id === id)
        if (index === -1) return
        gifts.value[index] = { id, ...payload }
    }

    const deleteGift = (id: number) => {
        gifts.value = gifts.value.filter(g => g.id !== id)
    }

    return {
        gifts,
        addGift,
        updateGift
    }



}