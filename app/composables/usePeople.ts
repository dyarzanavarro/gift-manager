import type { Person } from '~/models/person'

import { watch, onMounted } from 'vue'
import type { User } from '@supabase/supabase-js'
import type { Ref } from 'vue'



export const usePeople = () => {
    const client = useSupabaseClient()
    const user = useSupabaseUser() as Ref<User | null>

    const people = useState<Person[]>('people', () => [])
    const loading = useState<boolean>('people_loading', () => false)
    const error = useState<string | null>('people_error', () => null)

    const mapRow = (row: any): Person => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        birthday: row.birthday,
        notes: row.notes,
        createdAt: row.created_at
    })

    const ensureUser = async () => {
        const { data, error } = await client.auth.getSession()
        if (error) {
            console.error('getSession error', error.message)
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
            if (user.value?.id) fetchPeople() // use fetchPeople in the other composable
            else people.value = []            // or people.value = []
        })
        authSub = data.subscription
    })

    onBeforeUnmount(() => {
        authSub?.unsubscribe()
    })



    const fetchPeople = async () => {
        const u = await ensureUser()
        const uid = u?.id
        if (!uid) {
            people.value = []
            return
        }
        loading.value = true
        error.value = null
        const { data, error: err } = await client
            .from('people')
            .select('id, user_id, name, birthday, notes, created_at')
            .eq('user_id', uid)
            .order('name', { ascending: true })

        if (err) {
            error.value = err.message
            people.value = []
        } else {
            people.value = (data ?? []).map(mapRow)
        }
        loading.value = false
    }


    const addPerson = async (payload: Omit<Person, 'id' | 'userId' | 'createdAt'>) => {
        if (!user.value) throw new Error('Not authenticated')
        const { data, error: err } = await client
            .from('people')
            .insert([{ ...payload, user_id: user.value.id }])
            .select('id, user_id, name, birthday, notes, created_at')
            .single()
        if (err) throw err
        people.value.push(mapRow(data))
    }

    const updatePerson = async (id: string, payload: Omit<Person, 'id' | 'userId' | 'createdAt'>) => {
        if (!user.value) throw new Error('Not authenticated')
        const { data, error: err } = await client
            .from('people')
            .update({ ...payload })
            .eq('id', id)
            .eq('user_id', user.value.id)
            .select('id, user_id, name, birthday, notes, created_at')
            .single()
        if (err) throw err
        people.value = people.value.map(p => (p.id === id ? mapRow(data) : p))
    }

    const deletePerson = async (id: string) => {
        if (!user.value) throw new Error('Not authenticated')
        const { error: err } = await client
            .from('people')
            .delete()
            .eq('id', id)
            .eq('user_id', user.value.id)
        if (err) throw err
        people.value = people.value.filter(p => p.id !== id)
    }

    const reset = () => {
        people.value = []
        loading.value = false
        error.value = null
    }

    const getPersonById = (id: string) => people.value.find(p => p.id === id)

    watch(
        () => user.value?.id,
        uid => {
            if (uid) fetchPeople()
            else people.value = []
        },
        { immediate: true }
    )

    return {
        people,
        loading,
        error,
        reset,
        fetchPeople,
        addPerson,
        updatePerson,
        deletePerson,
        getPersonById
    }
}