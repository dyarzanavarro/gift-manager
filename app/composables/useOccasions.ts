import type { Occasion } from '~/models/occasion'
import { mockOccasions } from '~/data/mockOccasions'

export const useOccasions = () => {
    const occasions = useState<Occasion[]>('occasions_v1', () => [...mockOccasions])

    const addOccasion = (o: Omit<Occasion, 'id'>) => {
        const nextId = Math.max(0, ...occasions.value.map(x => x.id)) + 1
        occasions.value.push({ id: nextId, ...o })
    }

    const updateOccasion = (id: number, patch: Partial<Omit<Occasion, 'id'>>) => {
        const idx = occasions.value.findIndex(x => x.id === id)
        if (idx !== -1) occasions.value[idx] = { ...occasions.value[idx], ...patch }
    }

    const deleteOccasion = (id: number) => {
        occasions.value = occasions.value.filter(x => x.id !== id)
    }

    return { occasions, addOccasion, updateOccasion, deleteOccasion }
}
