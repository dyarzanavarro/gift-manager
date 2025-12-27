import type { Person } from '~/models/person'

import { watch } from 'vue'



export const usePeople = () => {
    const client = useSupabaseClient()
    const user = useSupabaseUser()

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


    const fetchPeople = async () => {
        const uid = user.value?.id
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

    const updatePerson = async (id: number, payload: Omit<Person, 'id' | 'userId' | 'createdAt'>) => {
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

    const deletePerson = async (id: number) => {
        if (!user.value) throw new Error('Not authenticated')
        const { error: err } = await client
            .from('people')
            .delete()
            .eq('id', id)
            .eq('user_id', user.value.id)
        if (err) throw err
        people.value = people.value.filter(p => p.id !== id)
    }

    const getPersonById = (id: number) => people.value.find(p => p.id === id)

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
        fetchPeople,
        addPerson,
        updatePerson,
        deletePerson,
        getPersonById
    }
}