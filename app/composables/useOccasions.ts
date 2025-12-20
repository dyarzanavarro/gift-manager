import type { Occasion } from '~/models/occasion'
import { mockOccasions } from '~/data/mockOccasions'

export const useOccasions = () => {
    const occasions = useState<Occasion[]>('occasions_v1', () => [...mockOccasions])

    const addOccasion = (o: Omit<Occasion, 'id'>) => {
        const nextId = Math.max(0, ...occasions.value.map(x => x.id)) + 1
        occasions.value.push({ id: nextId, ...o })
    }

    const updateOccasion = (id: number, patch: Partial<Omit<Occasion, 'id'>>) => {
        occasions.value = occasions.value.map(o =>
            o.id === id ? { ...o, ...patch } : o
        )
    }
    const deleteOccasion = (id: number) => {
        occasions.value = occasions.value.filter(x => x.id !== id)
    }

    return { occasions, addOccasion, updateOccasion, deleteOccasion }
}
