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

const baseRows = computed<GiftRow[]>(() => {
  const list = gifts.value.map(g => {
    const person = people.value.find(p => p.id === g.personId)
    const occ = occasions.value.find(o => o.id === g.occasionId)
    return {
      ...g,
      personName: person?.name ?? 'Unbekannt',
      occasionName: occ?.name ?? 'Unbekannt'
    }
  })

  return list
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

const personFilterItems = computed<SelectItem[]>(() => [
  { label: 'Alle Personen', value: null },
  ...personItems.value
])

const occasionFilterItems = computed<SelectItem[]>(() => [
  { label: 'Alle Anlaesse', value: null },
  ...occasionItems.value
])

const statusFilterItems: SelectItem[] = [
  { label: 'Alle Stati', value: null },
  ...statusItems
]

type SortKey = 'person' | 'occasion' | 'status'
type SortDir = 'asc' | 'desc'

const selectedPersonId = ref<string | null>(null)
const selectedOccasionId = ref<number | null>(null)
const selectedStatus = ref<GiftStatus | null>(null)
const sortKey = ref<SortKey>('person')
const sortDir = ref<SortDir>('asc')

const sortedRows = (list: GiftRow[]) => {
  const direction = sortDir.value === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    let compare = 0
    if (sortKey.value === 'person') {
      compare = a.personName.localeCompare(b.personName, 'de-CH')
    } else if (sortKey.value === 'occasion') {
      compare = a.occasionName.localeCompare(b.occasionName, 'de-CH')
    } else {
      compare = a.status.localeCompare(b.status, 'de-CH')
    }
    if (compare !== 0) return compare * direction
    const titleCompare = a.title.localeCompare(b.title, 'de-CH')
    if (titleCompare !== 0) return titleCompare * direction
    return a.personName.localeCompare(b.personName, 'de-CH') * direction
  })
}

const rows = computed<GiftRow[]>(() => {
  let list = baseRows.value
  if (selectedPersonId.value) {
    list = list.filter(r => r.personId === selectedPersonId.value)
  }
  if (selectedOccasionId.value !== null) {
    list = list.filter(r => r.occasionId === selectedOccasionId.value)
  }
  if (selectedStatus.value) {
    list = list.filter(r => r.status === selectedStatus.value)
  }
  return sortedRows(list)
})

const clearFilters = () => {
  selectedPersonId.value = null
  selectedOccasionId.value = null
  selectedStatus.value = null
  sortKey.value = 'person'
  sortDir.value = 'asc'
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const exportToHtml = () => {
  const list = rows.value
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const rowsHtml = list
    .map(r => `
        <tr>
          <td>${escapeHtml(r.title)}</td>
          <td>${escapeHtml(r.personName)}</td>
          <td>${escapeHtml(r.occasionName)}</td>
          <td>${escapeHtml(r.status)}</td>
          <td>${escapeHtml(r.link ?? '')}</td>
        </tr>
      `.trim())
    .join('\n')

  const html = `
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Geschenkideen Export</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 20px; margin: 0 0 6px; }
      .meta { color: #475569; font-size: 12px; margin-bottom: 16px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f8fafc; font-size: 12px; letter-spacing: 0.02em; text-transform: uppercase; }
      td { font-size: 13px; }
    </style>
  </head>
  <body>
    <h1>Geschenkideen</h1>
    <div class="meta">Exportiert: ${escapeHtml(now)} | Eintraege: ${list.length}</div>
    <table>
      <thead>
        <tr>
          <th>Titel</th>
          <th>Person</th>
          <th>Anlass</th>
          <th>Status</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="5">Keine Eintraege</td></tr>'}
      </tbody>
    </table>
  </body>
</html>
  `.trim()

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `geschenkideen-export-${new Date().toISOString().slice(0, 10)}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
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
const editedId = ref<string | null>(null)

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

  if (isEditing.value && !editedId.value) {
    return alert('Diese Geschenkidee hat keine gültige ID.')
  }

  const payload: Omit<GiftIdea, 'id'> = {
    personId: form.personId,
    title: form.title.trim(),
    notes: form.notes.trim() || undefined,
    occasionId: form.occasionId,
    status: form.status,
    link: form.link.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined
  }

  try {
    if (isEditing.value && editedId.value) {
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
  <UPage class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <UPageHeader
      title="Geschenkideen"
      class="text-gray-900 dark:text-gray-100"
      description="Verwalte Geschenkideen, Zuordnungen zu Personen, Anlässen und Status."
    ><UButton
          color="primary"
          variant="soft"
          size="sm"
          icon="i-heroicons-arrow-down-tray"
          @click="exportToHtml"
        >
          Export HTML
        </UButton>
    </UPageHeader>
<UContainer class="space-y-6">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-circle"
      >
        {{ error }}
      </UAlert>

      <UCard class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <template #header>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                Geschenkideen
              </h2>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <USelect
                v-model="selectedPersonId"
                :items="personFilterItems"
                value-attribute="value"
                option-attribute="label"
                placeholder="Person filtern"
                size="xs"
                class="min-w-[180px]"
              />
              <USelect
                v-model="selectedOccasionId"
                :items="occasionFilterItems"
                value-attribute="value"
                option-attribute="label"
                placeholder="Anlass filtern"
                size="xs"
                class="min-w-[180px]"
              />
              <USelect
                v-model="selectedStatus"
                :items="statusFilterItems"
                value-attribute="value"
                option-attribute="label"
                placeholder="Status filtern"
                size="xs"
                class="min-w-[150px]"
              />
              <USelect
                v-model="sortKey"
                :items="[
                  { label: 'Sort: Person', value: 'person' },
                  { label: 'Sort: Anlass', value: 'occasion' },
                  { label: 'Sort: Status', value: 'status' }
                ]"
                value-attribute="value"
                option-attribute="label"
                size="xs"
                class="min-w-[140px]"
              />
              <USelect
                v-model="sortDir"
                :items="[
                  { label: 'Aufsteigend', value: 'asc' },
                  { label: 'Absteigend', value: 'desc' }
                ]"
                value-attribute="value"
                option-attribute="label"
                size="xs"
                class="min-w-[140px]"
              />
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                @click="clearFilters"
              >
                Reset
              </UButton>
            
            </div>
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
          <template #title-cell="{ row }">
            <div class="max-w-[220px] whitespace-normal break-words leading-snug text-gray-900 dark:text-gray-100">
              {{ row.original.title }}
            </div>
          </template>

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
