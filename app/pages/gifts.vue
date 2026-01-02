<script setup lang="ts">
import type { TableColumn, SelectItem } from '@nuxt/ui'
import type { GiftIdea, GiftStatus } from '~/models/gift'

definePageMeta({ middleware: ['auth'] })

const { gifts, loading, error, fetchGifts, addGift, updateGift, deleteGift } = useGifts()
const { people } = usePeople()
const { occasions } = useOccasions()

onMounted(() => {
  fetchGifts()
})

interface GiftRow extends GiftIdea {
  personName: string
  occasionName: string
}

const occasionItems = computed<SelectItem[]>(() =>
  occasions.value.map(o => ({
    label: o.name,
    value: o.id
  }))
)

const rows = computed<GiftRow[]>(() => {
  const list = gifts.value.map(g => {
    const person = people.value.find(p => p.id === g.personId)
    const occ = occasions.value.find(o => o.id === g.occasionId)
    return {
      ...g,
      personName: person?.name ?? 'Unbekannt',
      occasionName: occ?.name ?? 'Unbekannt'
    }
  })

  return list.sort((a, b) => {
    const nameCompare = a.personName.localeCompare(b.personName, 'de-CH')
    if (nameCompare !== 0) return nameCompare
    const o = a.occasionName.localeCompare(b.occasionName, 'de-CH')
    if (o !== 0) return o
    return a.title.localeCompare(b.title, 'de-CH')
  })
})

const personItems = computed<SelectItem[]>(() =>
  people.value.map(p => ({
    label: p.name,
    value: p.id
  }))
)

const statusItems: SelectItem[] = [
  { label: 'Idee', value: 'idea' },
  { label: 'Geplant', value: 'planned' },
  { label: 'Gekauft', value: 'bought' },
  { label: 'Überreicht', value: 'given' }
]

const columns: TableColumn<GiftRow>[] = [
  { accessorKey: 'title', header: 'Geschenkidee' },
  { accessorKey: 'personName', header: 'Person' },
  { accessorKey: 'occasionName', header: 'Anlass' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'link', header: 'Link' },
  { accessorKey: 'imageUrl', header: 'Bild' },
  { id: 'actions', header: 'Aktionen' }
]

const isOpen = ref(false)
const isEditing = ref(false)
const editedId = ref<number | null>(null)

type GiftForm = {
  title: string
  personId: string | null
  notes: string
  occasionId: number | null
  status: GiftStatus
  link: string
  imageUrl: string
}

const form = reactive<GiftForm>({
  title: '',
  personId: null,
  notes: '',
  occasionId: null,
  status: 'idea',
  link: '',
  imageUrl: ''
})

const resetForm = () => {
  isEditing.value = false
  editedId.value = null
  form.personId = null
  form.title = ''
  form.notes = ''
  form.occasionId = null
  form.status = 'idea'
  form.link = ''
  form.imageUrl = ''
}

const onCreate = () => {
  resetForm()
  isEditing.value = false
  isOpen.value = true
}

const onEdit = (row: GiftRow) => {
  isEditing.value = true
  editedId.value = row.id
  form.personId = row.personId
  form.title = row.title
  form.notes = row.notes ?? ''
  form.occasionId = row.occasionId
  form.status = row.status
  form.link = row.link ?? ''
  form.imageUrl = row.imageUrl ?? ''
  isOpen.value = true
}

const onDelete = async (row: GiftRow) => {
  if (!confirm(`Geschenkidee "${row.title}" wirklich löschen?`)) return
  try {
    await deleteGift(row.id)
  } catch (err: any) {
    alert(err.message ?? 'Löschen fehlgeschlagen.')
  }
}

const onSubmit = async () => {
  if (!form.title.trim()) return alert('Bitte einen Titel angeben.')
  if (!form.personId) return alert('Bitte eine Person auswählen.')
  if (!form.occasionId) return alert('Bitte einen Anlass auswählen.')

  const payload: Omit<GiftIdea, 'id'> = {
    personId: Number(form.personId),
    title: form.title.trim(),
    notes: form.notes.trim() || undefined,
    occasionId: form.occasionId,
    status: form.status,
    link: form.link.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined
  }

  try {
    if (isEditing.value && editedId.value !== null) {
      await updateGift(editedId.value, payload)
    } else {
      await addGift(payload)
    }
    isOpen.value = false
  } catch (err: any) {
    alert(err.message ?? 'Speichern fehlgeschlagen.')
  }
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="Geschenkideen"
      class="text-gray-900 dark:text-gray-100"
      description="Verwalte Geschenkideen, Zuordnungen zu Personen, Anlässen und Status."
    />

    <UContainer class="space-y-6">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-circle"
      >
        {{ error }}
      </UAlert>

      <UCard class="bg-white dark:bg-gray-900 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Geschenkideen
            </h2>
            <div class="flex justify-end">
              <UButton
                icon="i-heroicons-plus"
                color="primary"
                class="font-bold"
                variant="solid"
                size="sm"
                @click="onCreate"
              >
                <span class="hidden sm:inline">Neue Geschenkidee</span>
                <span class="sm:hidden">Neue Idee</span>
              </UButton>
            </div>
          </div>
        </template>

        <div v-if="loading" class="p-3 text-sm text-gray-500">
          Lade Geschenkideen…
        </div>

        <UTable v-else :data="rows" :columns="columns">
          <template #personName-cell="{ row }">
            <span class="text-gray-900 dark:text-gray-100">
              <UButton
                :to="`/people/${row.original.personId}`"
                variant="ghost"
                color="primary"
                class="p-0 font-medium"
              >
                {{ row.original.personName }}
              </UButton>
            </span>
          </template>

          <template #occasionName-cell="{ row }">
            <span class="text-gray-700 dark:text-gray-300">
              {{ row.original.occasionName || '–' }}
            </span>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              size="xs"
              :color="row.original.status === 'bought'
                ? 'success'
                : row.original.status === 'planned'
                  ? 'warning'
                  : row.original.status === 'given'
                    ? 'info'
                    : 'neutral'"
              variant="soft"
            >
              {{
                row.original.status === 'idea'
                  ? 'Idee'
                  : row.original.status === 'planned'
                    ? 'Geplant'
                    : row.original.status === 'bought'
                      ? 'Gekauft'
                      : 'Überreicht'
              }}
            </UBadge>
          </template>

          <template #link-cell="{ row }">
            <div class="flex justify-start">
              <span v-if="row.original.link">
                <UButton
                  color="primary"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-link"
                  :to="row.original.link"
                  target="_blank"
                >
                  Link
                </UButton>
              </span>
              <span v-else class="text-gray-500 dark:text-gray-400 text-xs">
                {{ row.original.link || '–' }}
              </span>
            </div>
          </template>

          <template #imageUrl-cell="{ row }">
            <div class="flex justify-start">
              <span v-if="row.original.imageUrl">
                <UAvatar
                  :src="row.original.imageUrl"
                  alt="Bild zur Geschenkidee"
                  size="xs"
                  class="border border-gray-200 dark:border-gray-700"
                />
              </span>
              <span v-else class="text-gray-500 dark:text-gray-400 text-xs">
                {{ row.original.imageUrl || '–' }}
              </span>
            </div>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex gap-2">
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-pencil-square"
                @click="onEdit(row.original)"
              >
                Bearbeiten
              </UButton>

              <UButton
                size="xs"
                color="primary"
                variant="ghost"
                icon="i-heroicons-trash"
                @click="onDelete(row.original)"
              >
                Löschen
              </UButton>
            </div>
          </template>
        </UTable>
      </UCard>

      <UModal v-model:open="isOpen" :ui="{ width: 'sm:max-w-xl' }">
        <template #content>
          <UCard class="w-full max-w-xl mx-auto space-y-4">
            <template #header>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                {{ isEditing ? 'Geschenkidee bearbeiten' : 'Neue Geschenkidee anlegen' }}
              </h3>
            </template>

            <form class="space-y-4" @submit.prevent="onSubmit">
              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Person
                </label>
                <USelect
                  v-model="form.personId"
                  :items="personItems"
                  value-attribute="value"
                  option-attribute="label"
                  placeholder="Person auswählen"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Titel
                </label>
                <UInput
                  v-model="form.title"
                  placeholder="z. B. Bluetooth-Kopfhörer"
                  class="w-full"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Anlass
                </label>
                <USelect
                  v-model="form.occasionId"
                  :items="occasionItems"
                  value-attribute="value"
                  option-attribute="label"
                  placeholder="Anlass auswählen"
                  class="w-full"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <USelect
                  v-model="form.status"
                  :items="statusItems"
                  class="w-full"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Link (optional)
                </label>
                <UInput
                  v-model="form.link"
                  type="url"
                  placeholder="https://..."
                  class="w-full"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Bild-URL (optional)
                </label>
                <UInput
                  v-model="form.imageUrl"
                  type="url"
                  placeholder="https://... (Bild zum Geschenk)"
                  class="w-full"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Notizen
                </label>
                <UTextarea
                  v-model="form.notes"
                  :rows="3"
                  placeholder="Details, Vorlieben, Links, Budget..."
                  class="w-full"
                />
              </div>

              <div class="flex justify-end gap-2 pt-3">
                <UButton
                  color="neutral"
                  variant="soft"
                  type="button"
                  @click="isOpen = false"
                >
                  Abbrechen
                </UButton>

                <UButton color="primary" type="submit">
                  {{ isEditing ? 'Speichern' : 'Hinzufügen' }}
                </UButton>
              </div>
            </form>
          </UCard>
        </template>
      </UModal>
    </UContainer>
  </UPage>
</template>
