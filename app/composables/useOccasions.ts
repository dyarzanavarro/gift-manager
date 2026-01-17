import type { Occasion } from '~/models/occasion'
import { watch, onMounted, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import type { User } from '@supabase/supabase-js'

export const useOccasions = () => {
    const client = useSupabaseClient()
    const user = useSupabaseUser() as Ref<User | null>

    const occasions = useState<Occasion[]>('occasions_v1', () => [])
    const loading = useState<boolean>('occasions_loading', () => false)
    const error = useState<string | null>('occasions_error', () => null)

    const mapRow = (row: any): Occasion => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        type: row.type,
        createdAt: row.created_at
    })

    type OccasionUpsertPayload = Omit<Occasion, 'id' | 'userId' | 'createdAt'>

    const toDb = (p: OccasionUpsertPayload) => ({
        name: p.name,
        type: p.type
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
            if (user.value?.id) fetchOccasions()
            else occasions.value = []
        })
        authSub = data.subscription
    })

    onBeforeUnmount(() => {
        authSub?.unsubscribe()
    })

    const fetchOccasions = async () => {
        const u = await ensureUser()
        const uid = u?.id
        if (!uid) {
            occasions.value = []
            return
        }
        loading.value = true
        error.value = null
        const { data, error: err } = await client
            .from('occasions')
            .select('id, user_id, name, type, created_at')
            .eq('user_id', uid)
            .order('name', { ascending: true })

        if (err) {
            error.value = err.message
            occasions.value = []
        } else {
            occasions.value = (data ?? []).map(mapRow)
        }
        loading.value = false
    }

    const addOccasion = async (payload: OccasionUpsertPayload) => {
        const u = await ensureUser()
        if (!u) throw new Error('Not authenticated')

        const { data, error: err } = await client
            .from('occasions')
            .insert([{ ...toDb(payload), user_id: u.id }])
            .select('id, user_id, name, type, created_at')
            .single()

        if (err) throw err
        occasions.value.push(mapRow(data))
    }

    const updateOccasion = async (id: string, payload: OccasionUpsertPayload) => {
        const u = await ensureUser()
        const uid = u?.id
        if (!uid) throw new Error('Not authenticated')
        const { data, error: err } = await client
            .from('occasions')
            .update(toDb(payload))
            .eq('id', id)
            .eq('user_id', uid)
            .select('id, user_id, name, type, created_at')
            .single()

        if (err) throw err
        occasions.value = occasions.value.map(o => (o.id === id ? mapRow(data) : o))
    }

    const deleteOccasion = async (id: string) => {
        if (!user.value) throw new Error('Not authenticated')
        const { error: err } = await client
            .from('occasions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.value.id)
        if (err) throw err
        occasions.value = occasions.value.filter(o => o.id !== id)
    }

    const reset = () => {
        occasions.value = []
        loading.value = false
        error.value = null
    }

    watch(
        () => user.value?.id,
        uid => {
            if (uid) fetchOccasions()
            else occasions.value = []
        },
        { immediate: true }
    )

    return {
        occasions,
        loading,
        error,
        reset,
        fetchOccasions,
        addOccasion,
        updateOccasion,
        deleteOccasion
    }
}
