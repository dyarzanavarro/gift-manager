<script setup lang="ts">
import type { Occasion, OccasionType } from '~/models/occasion'
import type { TableColumn, SelectItem } from '@nuxt/ui'

definePageMeta({ middleware: ['auth'] })

const { occasions, loading, error, fetchOccasions, addOccasion, updateOccasion, deleteOccasion } = useOccasions()

const columns: TableColumn<Occasion>[] = [
  { accessorKey: 'name', header: 'Anlass' },
  { accessorKey: 'type', header: 'Typ' },
  { id: 'actions', header: 'Aktionen' }
]

const typeItems: SelectItem[] = [
  { label: 'Geburtstag', value: 'birthday' },
  { label: 'Weihnachten', value: 'christmas' },
  { label: 'Benutzerdefiniert', value: 'custom' }
]

const typeLabel = (value: OccasionType) => {
  switch (value) {
    case 'birthday': return 'Geburtstag'
    case 'christmas': return 'Weihnachten'
    case 'custom': return 'Benutzerdefiniert'
    default: return value
  }
}

const isOpen = ref(false)
const isEditing = ref(false)
const editedId = ref<string | null>(null)

const form = reactive<Omit<Occasion, 'id' | 'userId' | 'createdAt'>>({
  name: '',
  type: 'custom'
})

onMounted(() => {
  fetchOccasions()
})

const resetForm = () => {
  isEditing.value = false
  editedId.value = null
  form.name = ''
  form.type = 'custom'
}

const onCreate = () => {
  resetForm()
  isOpen.value = true
}

const onEdit = (o: Occasion) => {
  isEditing.value = true
  editedId.value = o.id
  form.name = o.name
  form.type = o.type
  isOpen.value = true
}

const onDelete = async (o: Occasion) => {
  if (!confirm(`Anlass "${o.name}" wirklich loeschen?`)) return
  try {
    await deleteOccasion(o.id)
  } catch (err: any) {
    alert(err.message ?? 'Loeschen fehlgeschlagen.')
  }
}

const onSubmit = async () => {
  if (!form.name.trim()) return alert('Bitte einen Namen angeben.')
  try {
    if (isEditing.value && editedId.value !== null) {
      await updateOccasion(editedId.value, { ...form, name: form.name.trim() })
    } else {
      await addOccasion({ ...form, name: form.name.trim() })
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
      title="Anlaesse"
      description="Verwalte Anlaesse fuer Geschenkideen."
      class="text-gray-900 dark:text-gray-100"
    />

    <UContainer class="space-y-6">
      <UAlert v-if="error" color="error" variant="soft" icon="i-heroicons-exclamation-circle">
        {{ error }}
      </UAlert>

      <UCard class="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Anlaesse
            </h2>
            <div class="flex justify-end">
              <UButton
                icon="i-heroicons-plus"
                color="primary"
                class="font-bold"
                variant="solid"
                @click="onCreate"
              >
                Neuer Anlass
              </UButton>
            </div>
          </div>
        </template>

        <div v-if="loading" class="p-3 text-sm text-gray-500">Lade Anlaesse...</div>

        <div v-else-if="occasions.length === 0" class="p-3 text-sm text-gray-500">
          Noch keine Anlaesse vorhanden.
        </div>

        <UTable v-else :data="occasions" :columns="columns">
          <template #type-cell="{ row }">
            <span class="text-gray-700 dark:text-gray-300">
              {{ typeLabel(row.original.type) }}
            </span>
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
                Loeschen
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
                {{ isEditing ? 'Anlass bearbeiten' : 'Neuen Anlass anlegen' }}
              </h3>
            </template>

            <form class="space-y-4" @submit.prevent="onSubmit">
              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <UInput
                  v-model="form.name"
                  placeholder="z. B. Hochzeit, Jubiläum, ..."
                  class="w-full"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Typ
                </label>
                <USelect
                  v-model="form.type"
                  :items="typeItems"
                  value-attribute="value"
                  option-attribute="label"
                  placeholder="Typ auswaehlen"
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
                  {{ isEditing ? 'Speichern' : 'Hinzufuegen' }}
                </UButton>
              </div>
            </form>
          </UCard>
        </template>
      </UModal>
    </UContainer>
  </UPage>
</template>
