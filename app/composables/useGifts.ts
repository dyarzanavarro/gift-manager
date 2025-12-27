import type { GiftIdea, GiftStatus } from '~/models/gift'
import { watch } from 'vue'


export const useGifts = () => {
    const client = useSupabaseClient()
    const user = useSupabaseUser()

    const gifts = useState<GiftIdea[]>('gifts', () => [])
    const loading = useState<boolean>('gifts_loading', () => false)
    const error = useState<string | null>('gifts_error', () => null)

    const mapRow = (row: any): GiftIdea => ({
        id: row.id,
        userId: row.user_id,
        personId: row.person_id,
        occasionId: row.occasion_id,
        title: row.title,
        notes: row.notes,
        status: row.status,
        link: row.link,
        imageUrl: row.image_url,
        createdAt: row.created_at
    })


    const fetchGifts = async () => {
        const uid = user.value?.id
        if (!uid) {
            gifts.value = []
            return
        }
        loading.value = true
        error.value = null
        const { data, error: err } = await client
            .from('gifts')
            .select('id, user_id, person_id, occasion_id, title, notes, status, link, image_url, created_at')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })

        if (err) {
            error.value = err.message
            gifts.value = []
        } else {
            gifts.value = (data ?? []).map(mapRow)
        }
        loading.value = false
    }


    const addGift = async (payload: Omit<GiftIdea, 'id' | 'userId' | 'createdAt'>) => {
        if (!user.value) throw new Error('Not authenticated')
        const { data, error: err } = await client
            .from('gifts')
            .insert([{ ...payload, user_id: user.value.id }])
            .select('id, user_id, person_id, occasion_id, title, notes, status, link, image_url, created_at')
            .single()
        if (err) throw err
        gifts.value.unshift(mapRow(data))
    }

    const updateGift = async (id: number, payload: Omit<GiftIdea, 'id' | 'userId' | 'createdAt'>) => {
        if (!user.value) throw new Error('Not authenticated')
        const { data, error: err } = await client
            .from('gifts')
            .update({ ...payload })
            .eq('id', id)
            .eq('user_id', user.value.id)
            .select('id, user_id, person_id, occasion_id, title, notes, status, link, image_url, created_at')
            .single()
        if (err) throw err
        gifts.value = gifts.value.map(g => (g.id === id ? mapRow(data) : g))
    }

    const deleteGift = async (id: number) => {
        if (!user.value) throw new Error('Not authenticated')
        const { error: err } = await client
            .from('gifts')
            .delete()
            .eq('id', id)
            .eq('user_id', user.value.id)
        if (err) throw err
        gifts.value = gifts.value.filter(g => g.id !== id)
    }

    const getGiftsByPerson = (personId: number) =>
        computed(() => gifts.value.filter(g => g.personId === personId))

    const setStatus = async (id: number, status: GiftStatus) => {
        const gift = gifts.value.find(g => g.id === id)
        if (!gift) return
        await updateGift(id, { ...gift, status })
    }

    watch(
        () => user.value?.id,
        uid => {
            if (uid) fetchGifts()
            else gifts.value = []
        },
        { immediate: true }
    )

    return { gifts, loading, error, fetchGifts, addGift, updateGift, deleteGift, getGiftsByPerson, setStatus }
}