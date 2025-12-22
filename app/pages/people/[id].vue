<script setup lang="ts">
import type { Person } from '~/models/person'
import type { GiftIdea, GiftStatus } from '~/models/gift'

const route = useRoute()

const personId = computed(() => Number(route.params.id))

const { people } = usePeople()
const { gifts, deleteGift } = useGifts()
const { occasions } = useOccasions()
const { addGift } = useGifts()
const isGiftModalOpen = ref(false)

const person = computed<Person | undefined>(() =>
  people.value.find(p => p.id === personId.value)
)

const personGifts = computed(() =>
  gifts.value
    .filter(g => g.personId === personId.value)
    .map(g => ({
      ...g,
      occasionName: occasions.value.find(o => o.id === g.occasionId)?.name ?? 'Unbekannt'
    }))
)

const currentGifts = computed(() =>
  personGifts.value.filter(g => g.status !== 'given')
)

const pastGifts = computed(() =>
  personGifts.value.filter(g => g.status === 'given')
)

const groupedCurrent = computed(() => ({
  idea: currentGifts.value.filter(g => g.status === 'idea'),
  planned: currentGifts.value.filter(g => g.status === 'planned'),
  bought: currentGifts.value.filter(g => g.status === 'bought')
}))

const onDeleteGift = (g: GiftIdea) => {
  if (confirm(`"${g.title}" wirklich löschen?`)) deleteGift(g.id)
}

const formatDateCH = (iso?: string | null) => {
  if (!iso) return '–'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso // fallback, falls nicht ISO
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

const stats = computed(() => {
  const list = personGifts.value
  const count = (s: GiftStatus) => list.filter(g => g.status === s).length
  return {
    idea: count('idea'),
    planned: count('planned'),
    bought: count('bought'),
    given: count('given')
  }
})

type GiftCreateForm = {
  title: string
  occasionId: number | null
  status: GiftStatus
  link: string
  imageUrl: string
  notes: string
}

const giftForm = reactive<GiftCreateForm>({
  title: '',
  occasionId: null,
  status: 'idea',
  link: '',
  imageUrl: '',
  notes: ''
})

const resetGiftForm = () => {
  giftForm.title = ''
  giftForm.occasionId = null
  giftForm.status = 'idea'
  giftForm.link = ''
  giftForm.imageUrl = ''
  giftForm.notes = ''
}

const occasionItems = computed(() =>
  occasions.value.map(o => ({ label: o.name, value: o.id }))
)

const statusItems = [
  { label: 'Idee', value: 'idea' },
  { label: 'Geplant', value: 'planned' },
  { label: 'Gekauft', value: 'bought' },
  { label: 'Überreicht', value: 'given' }
]

const openGiftModal = () => {
  resetGiftForm()
  isGiftModalOpen.value = true
}

const submitGiftForPerson = () => {
  if (!person.value) return
  if (!giftForm.title.trim()) return alert('Bitte einen Titel angeben.')
  if (!giftForm.occasionId) return alert('Bitte einen Anlass auswählen.')

  addGift({
    personId: person.value.id,
    occasionId: giftForm.occasionId,
    title: giftForm.title.trim(),
    status: giftForm.status,
    notes: giftForm.notes.trim() || undefined,
    link: giftForm.link.trim() || undefined,
    imageUrl: giftForm.imageUrl.trim() || undefined
  })

  isGiftModalOpen.value = false
}

</script>

<template>
  <UPage>
    <UPageHeader
      :title="person ? person.name : 'Person nicht gefunden'"
      :description="person?.birthday ? `Geburtstag: ${ formatDateCH(person.birthday) }` : 'Kein Geburtstag gespeichert'"
      :headline="person?.notes ? `Notizen: ${person.notes}` : 'Keine Notizen gespeichert'"
    />

    <UContainer class="space-y-6">
      <UCard v-if="!person">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Diese Person existiert nicht (mehr) oder die ID ist ungültig.
        </p>
        <UButton to="/people" class="mt-3" color="primary" variant="soft">Zurück</UButton>
      </UCard>

      <template v-else>
        <!-- Quick Actions -->
        <div class="flex flex-wrap gap-2 justify-end">
          <UButton
              @click="openGiftModal"
            color="primary"
            icon="i-heroicons-plus"
          >
            Geschenkidee hinzufügen
          </UButton>

          <UButton to="/people/people" color="neutral" variant="soft">
            Zur Personenliste
          </UButton>
        </div>

        <!-- Aktuelle Geschenkideen -->
        <UCard>
          <template #header>
            <h2 class="text-sm font-medium">Aktuelle Geschenkideen</h2>
          </template>

          <div class="grid gap-6 md:grid-cols-3">
            <div>
              <h3 class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Ideen</h3>
              <div class="space-y-2">
                <UCard v-for="g in groupedCurrent.idea" :key="g.id" class="p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-medium">{{ g.title }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ g.occasionName }}</p>
                    </div>
                    <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-trash" @click="onDeleteGift(g)" />
                  </div>
                </UCard>
                <p v-if="groupedCurrent.idea.length === 0" class="text-xs text-gray-500 dark:text-gray-400">–</p>
              </div>
            </div>

            <div>
              <h3 class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Geplant</h3>
              <div class="space-y-2">
                <UCard v-for="g in groupedCurrent.planned" :key="g.id" class="p-3">
                    <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-medium">{{ g.title }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ g.occasionName }}</p>
                    </div>
                    <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-trash" @click="onDeleteGift(g)" />
                  </div>
                </UCard>
                <p v-if="groupedCurrent.planned.length === 0" class="text-xs text-gray-500 dark:text-gray-400">–</p>
              </div>
            </div>

            <div>
              <h3 class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Gekauft</h3>
              <div class="space-y-2">
                <UCard v-for="g in groupedCurrent.bought" :key="g.id" class="p-3">
                  <p class="font-medium">{{ g.title }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ g.occasionName }}</p>
                </UCard>
                <p v-if="groupedCurrent.bought.length === 0" class="text-xs text-gray-500 dark:text-gray-400">–</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Vergangene Geschenke -->
        <UCard>
          <template #header>
            <h2 class="text-sm font-medium">Vergangene Geschenke (Überreicht)</h2>
          </template>

          <div class="space-y-2">
            <UCard v-for="g in pastGifts" :key="g.id" class="p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-medium">{{ g.title }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ g.occasionName }}</p>
                  <p v-if="g.notes" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ g.notes }}</p>
                </div>
              </div>
            </UCard>

            <p v-if="pastGifts.length === 0" class="text-xs text-gray-500 dark:text-gray-400">
              Noch keine überreichten Geschenke erfasst.
            </p>
          </div>
        </UCard>
      </template>
      <UModal v-model:open="isGiftModalOpen" :ui="{ width: 'sm:max-w-xl' }">
  <template #content>
    <UCard class="w-full max-w-xl mx-auto space-y-4">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          Neue Geschenkidee für {{ person?.name }}
        </h3>
      </template>

      <form class="space-y-4" @submit.prevent="submitGiftForPerson">
        <!-- Titel -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Titel</label>
          <UInput
            v-model="giftForm.title"
            placeholder="z. B. Bluetooth-Kopfhörer"
            class="w-full"
          />
        </div>

        <!-- Anlass (gleich wie bei people: USelect) -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Anlass</label>
          <USelect
            v-model="giftForm.occasionId"
            :items="occasionItems"
            value-attribute="value"
            option-attribute="label"
            placeholder="Anlass auswählen"
            class="w-full"
          />
        </div>

        <!-- Status -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
          <USelect v-model="giftForm.status" :items="statusItems" class="w-full" />
        </div>

        <!-- Link -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Link (optional)</label>
          <UInput v-model="giftForm.link" type="url" placeholder="https://..." class="w-full" />
        </div>

        <!-- Bild-URL -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Bild-URL (optional)</label>
          <UInput v-model="giftForm.imageUrl" type="url" placeholder="https://..." class="w-full" />
        </div>

        <!-- Notizen -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Notizen</label>
          <UTextarea
            v-model="giftForm.notes"
            :rows="3"
            placeholder="Vorlieben, No-Gos, Budget..."
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-2 pt-3">
          <UButton color="neutral" variant="soft" type="button" @click="isGiftModalOpen = false">
            Abbrechen
          </UButton>
          <UButton color="primary" type="submit">Hinzufügen</UButton>
        </div>
      </form>
    </UCard>
  </template>
</UModal>
    </UContainer>
  </UPage>
</template>
