
import { usePeople } from './usePeople'
import { useGifts } from './useGifts'
import { useOccasions } from './useOccasions'
import { watch } from 'vue'


export const useAppData = () => {
    const user = useSupabaseUser()

    const people = usePeople()
    const gifts = useGifts()
    const occasions = useOccasions()

    const ready = useState<boolean>('app_ready', () => false)

    watch(
        () => user.value?.id,
        async (uid) => {
            ready.value = false

            if (!uid) {
                people.reset()
                gifts.reset()
                return
            }

            // Login: einmal alles laden
            await Promise.all([
                people.fetchPeople(),
                gifts.fetchGifts(),
            ])

            ready.value = true
        },
        { immediate: true }
    )

    return { ready, people, gifts, occasions }
}
