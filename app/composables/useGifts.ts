import type { GiftIdea, GiftStatus } from '~/models/gift'
import { watch, onMounted } from 'vue'

import type { User } from '@supabase/supabase-js'
import type { Ref } from 'vue'


export const useGifts = () => {
    const client = useSupabaseClient()
    const user = useSupabaseUser() as Ref<User | null>

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

    type GiftUpsertPayload = Omit<GiftIdea, 'id' | 'userId' | 'createdAt'>

    const toDb = (p: GiftUpsertPayload) => ({
        person_id: p.personId,
        occasion_id: p.occasionId,
        title: p.title,
        notes: p.notes ?? null,
        status: p.status,
        link: p.link ?? null,
        image_url: p.imageUrl ?? null
    })

    const ensureUser = async () => {
        const { data, error } = await client.auth.getSession()
        if (error) {
            return null
        }
        user.value = data.session?.user ?? null
        return user.value
    }

    let authSub: { unsubscribe: () => void } | null = null

    onMounted(async () => {
        await ensureUser()
        const { data } = client.auth.onAuthStateChange((_event, session) => {
            user.value = session?.user ?? null
            if (user.value?.id) fetchGifts() // use fetchPeople in the other composable
            else gifts.value = []            // or people.value = []
        })
        authSub = data.subscription
    })

    onBeforeUnmount(() => {
        authSub?.unsubscribe()
    })


    const fetchGifts = async () => {
        const u = await ensureUser()
        const uid = u?.id
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


    const addGift = async (payload: GiftUpsertPayload) => {
        if (!user.value) throw new Error('Not authenticated')

        const { data, error: err } = await client
            .from('gifts')
            .insert([{ ...toDb(payload), user_id: user.value.id }])
            .select('id, user_id, person_id, occasion_id, title, notes, status, link, image_url, created_at')
            .single()

        if (err) throw err
        gifts.value.unshift(mapRow(data))
    }

    const updateGift = async (id: number, payload: GiftUpsertPayload) => {
        if (!user.value) throw new Error('Not authenticated')
        const { data, error: err } = await client
            .from('gifts')
            .update(toDb(payload))
            .eq('id', id)
            .eq('user_id', user.value.id)
            .select('id, user_id, person_id, occasion_id, title, notes, status, link, image_url, created_at')
            .single()

        if (err) throw err
        gifts.value = gifts.value.map(g => (g.id === id ? mapRow(data) : g))
    }
    const reset = () => {
        gifts.value = []
        loading.value = false
        error.value = null
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

    const getGiftsByPerson = (personId: string) =>
        computed(() => gifts.value.filter(g => g.personId === personId))

    const setStatus = async (id: number, status: GiftStatus) => {
        const gift = gifts.value.find(g => g.id === id)
        if (!gift) return

        await updateGift(id, {
            personId: gift.personId,
            occasionId: gift.occasionId,
            title: gift.title,
            notes: gift.notes,
            status,
            link: gift.link,
            imageUrl: gift.imageUrl
        })
    }
    watch(
        () => user.value?.id,
        uid => {
            if (uid) fetchGifts()
            else gifts.value = []
        },
        { immediate: true }
    )



    return { gifts, loading, error, reset, fetchGifts, addGift, updateGift, deleteGift, getGiftsByPerson, setStatus }
}