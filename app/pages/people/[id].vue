<script setup lang="ts">
import type { Person } from '~/models/person'
import type { GiftIdea, GiftStatus } from '~/models/gift'
import type { AISuggestion } from '~/composables/useAIGiftSuggestions'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const personId = computed(() => String(route.params.id))

const { people, fetchPeople, loading, error } = usePeople()
const { occasions } = useOccasions()
const isGiftModalOpen = ref(false)
const ready = ref(false)


const isAiModalOpen = ref(false)

type AiSuggestion = {
  title: string
  reason: string
  category: string
  priceHint: string
}

const isAiOpen = ref(false)
const aiLoading = ref(false)
const aiError = ref<string | null>(null)
const aiHint = ref('')
const aiSuggestions = ref<AiSuggestion[]>([])

const openAiModal = () => {
  aiError.value = null
  aiHint.value = ''
  aiSuggestions.value = []
  isAiOpen.value = true
}

const fetchAiSuggestions = async () => {
  if (!person.value) return
  aiLoading.value = true
  aiError.value = null
  aiSuggestions.value = []

  try {
    const occId = giftForm.occasionId
      ?? occasions.value.find(o => o.name === 'Allgemein')?.id
      ?? occasions.value[0]?.id
    if (!occId) throw new Error('Kein Anlass verfügbar (occasionId fehlt).')

    const res = await $fetch<{ suggestions: AiSuggestion[] }>('/api/gift-suggestions', {
      method: 'POST',
      body: {
        personId: person.value.id,
        occasionId: occId,
        hint: aiHint.value.trim() || undefined
      }
    })

    aiSuggestions.value = res.suggestions
  } catch (e: any) {
    aiError.value = e?.data?.message || e?.message || 'KI-Vorschläge fehlgeschlagen.'
  } finally {
    aiLoading.value = false
  }
}

const applySuggestion = async (s: AiSuggestion) => {
  if (!person.value) return

  const occId = giftForm.occasionId
    ?? occasions.value.find(o => o.name === 'Allgemein')?.id
    ?? occasions.value[0]?.id
  if (!occId) return alert('Bitte zuerst einen Anlass wählen (oder Allgemein muss existieren).')

  try {
    await addGift({
      personId: person.value.id,
      occasionId: occId,
      title: s.title,
      status: 'idea',
      notes: `Warum: ${s.reason}\nKategorie: ${s.category}\nPreis: ${s.priceHint}`,
      link: undefined,
      imageUrl: undefined
    })
    isAiOpen.value = false
  } catch (err: any) {
    alert(err.message ?? 'Übernehmen fehlgeschlagen.')
  }
}




const { gifts, deleteGift, addGift, fetchGifts, loading: giftsLoading, error: giftsError } = useGifts()
onMounted(async () => {
  if (!people.value.length) await fetchPeople()
  if (!gifts.value.length) await fetchGifts()
  ready.value = true
})
const person = computed<Person | undefined>(() =>
  people.value.find(p => String(p.id) === personId.value)
)

const personGifts = computed(() =>
  gifts.value
    .filter(g => String(g.personId) === personId.value)
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

const onDeleteGift = async (g: GiftIdea) => {
  if (!confirm(`"${g.title}" wirklich loeschen?`)) return
  try { await deleteGift(g.id) } catch (err: any) { alert(err.message ?? 'Loeschen fehlgeschlagen.') }
}

const shareGift = async (g: GiftIdea) => {
  const text = g.title
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
    if (navigator.share) {
      await navigator.share({ title: 'Geschenkidee', text })
    } else {
      alert('Geschenkidee kopiert.')
    }
  } catch (err: any) {
    alert(err?.message ?? 'Teilen fehlgeschlagen.')
  }
}



const formatDateCH = (iso?: string | null) => {
  if (!iso) return '–'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso // fallback
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
  occasionId: string | null
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

const submitGiftForPerson = async () => {
  if (!person.value?.id) return alert('Keine gueltige Person ausgewaehlt.')
  if (!giftForm.title.trim()) return alert('Bitte einen Titel angeben.')
  if (!giftForm.occasionId) return alert('Bitte einen Anlass auswaehlen.')
  try {
    await addGift({
      personId: person.value.id,
      occasionId: giftForm.occasionId!,
      title: giftForm.title.trim(),
      status: giftForm.status,
      notes: giftForm.notes.trim() || undefined,
      link: giftForm.link.trim() || undefined,
      imageUrl: giftForm.imageUrl.trim() || undefined
    })
    isGiftModalOpen.value = false
  } catch (err: any) {
    alert(err.message ?? 'Speichern fehlgeschlagen.')
  }
}

</script>

<template>
  <UPage>
    <UPageHeader
      :title="person ? person.name : 'Person ladet'"
      :description="person?.birthday ? `Geburtstag: ${ formatDateCH(person.birthday) }` : 'Kein Geburtstag gespeichert'"
      :headline="person?.notes ? `Notizen: ${person.notes}` : 'Keine Notizen gespeichert'"
    />

    <UContainer class="space-y-6">
     <UAlert v-if="error" color="error" variant="soft" icon="i-heroicons-exclamation-circle">
      {{ error }}
    </UAlert>
  <UCard v-if="!ready || loading">
  <p class="text-sm text-gray-600 dark:text-gray-300">Lade Personendaten…</p>
</UCard>

<UCard v-else-if="!person">
  <p class="text-sm text-gray-600 dark:text-gray-300">
    Diese Person existiert nicht (mehr) oder die ID ist ungültig.
  </p>
  <UButton to="/people" class="mt-3" color="primary" variant="soft">Zurück</UButton>
</UCard>

      <template v-else>
             <!-- Aktuelle Geschenkideen -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Aktuelle Geschenkideen
            </h2>
            <div class="flex justify-end gap-4">
          <UButton
              @click="openGiftModal"
            color="primary"
            icon="i-heroicons-plus"
          >
            Geschenkidee hinzufügen
          </UButton>
<UButton
  @click="openAiModal"
  color="neutral"
  variant="soft"
  icon="i-heroicons-sparkles"
>
  KI-Vorschläge
</UButton>
          
          </div>
        </div>
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
                    <div class="flex items-center gap-1">
                      <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-share" @click="shareGift(g)" />
                      <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-trash" @click="onDeleteGift(g)" />
                    </div>
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
                    <div class="flex items-center gap-1">
                      <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-share" @click="shareGift(g)" />
                      <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-trash" @click="onDeleteGift(g)" />
                    </div>
                  </div>
                </UCard>
                <p v-if="groupedCurrent.planned.length === 0" class="text-xs text-gray-500 dark:text-gray-400">–</p>
              </div>
            </div>

            <div>
              <h3 class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Gekauft</h3>
              <div class="space-y-2">
                <UCard v-for="g in groupedCurrent.bought" :key="g.id" class="p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-medium">{{ g.title }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ g.occasionName }}</p>
                    </div>
                    <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-share" @click="shareGift(g)" />
                  </div>
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
                <UButton size="xs" color="primary" variant="ghost" icon="i-heroicons-share" @click="shareGift(g)" />
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
     <UCard class="w-full max-w-xl mx-auto space-y-4 max-h-[80vh] overflow-y-auto">
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

<!-- AI Geschenkideen Modal -->
<UModal v-model:open="isAiOpen" :ui="{ width: 'sm:max-w-2xl' }">
  <template #content>
    <UCard class="w-full max-w-2xl mx-auto space-y-4 max-h-[80vh] overflow-y-auto">
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <div>
            <h3 class="text-lg font-medium">KI-Vorschläge</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              5 Geschenkideen für {{ person?.name }} (Status: Idee)
            </p>
          </div>

          <UButton
            :loading="aiLoading"
            color="primary"
            icon="i-heroicons-arrow-path"
            @click="fetchAiSuggestions"
          >
            Generieren
          </UButton>
        </div>
      </template>

      <UAlert v-if="aiError" color="error" variant="soft" icon="i-heroicons-exclamation-circle">
        {{ aiError }}
      </UAlert>

      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
          Hinweis (optional)
        </label>
        <UInput v-model="aiHint" placeholder="z.B. Budget 30-50 CHF, mag Tech, mag Kaffee..." />
      </div>

      <div v-if="aiLoading" class="text-sm text-gray-500">Generiere Vorschläge…</div>

      <div v-else class="space-y-3">
        <UCard v-for="(s, idx) in aiSuggestions" :key="idx" class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="font-medium">{{ s.title }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ s.category }} · {{ s.priceHint }}
              </p>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{ s.reason }}
              </p>
            </div>

            <UButton
              size="sm"
              color="primary"
              @click="applySuggestion(s)"
            >
              Übernehmen
            </UButton>
          </div>
        </UCard>

        <p v-if="aiSuggestions.length === 0" class="text-sm text-gray-500">
          Noch keine Vorschläge. Klick auf “Generieren”.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="neutral" variant="soft" @click="isAiOpen = false">
            Schließen
          </UButton>
        </div>
      </template>
    </UCard>
  </template>
</UModal>
    </UContainer>
  </UPage>
</template>
