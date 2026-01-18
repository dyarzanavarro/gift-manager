<script setup lang="ts">
import type { Occasion } from '~/models/occasion'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ middleware: ['auth'] })

const { occasions, loading, error, fetchOccasions, addOccasion, updateOccasion, deleteOccasion } = useOccasions()

const columns: TableColumn<Occasion>[] = [
  { accessorKey: 'name', header: 'Anlass' },
  { id: 'actions', header: 'Aktionen' }
]

const isOpen = ref(false)
const isEditing = ref(false)
const editedId = ref<string | null>(null)

const form = reactive<Omit<Occasion, 'id' | 'userId' | 'createdAt'>>({
  name: ''
})

const isProtectedOccasion = (o: Occasion) => {
  const name = o.name.trim().toLowerCase()
  return name === 'geburtstag' || name === 'weihnachten'
}

onMounted(() => {
  fetchOccasions()
})

const resetForm = () => {
  isEditing.value = false
  editedId.value = null
  form.name = ''
}

const onCreate = () => {
  resetForm()
  isOpen.value = true
}

const onEdit = (o: Occasion) => {
  isEditing.value = true
  editedId.value = o.id
  form.name = o.name
  isOpen.value = true
}

const onDelete = async (o: Occasion) => {
  if (isProtectedOccasion(o)) return alert('Standard-Anlaesse koennen nicht geloescht werden.')
  if (!confirm(`Anlass "${o.name}" wirklich löschen?`)) return
  try {
    await deleteOccasion(o.id)
  } catch (err: any) {
    alert(err.message ?? 'Löschen fehlgeschlagen.')
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
      title="Anlässe"
      description="Verwalte Anlässe für Geschenkideen."
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
              Anlässe
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

        <div v-if="loading" class="p-3 text-sm text-gray-500">Lade Anlässe...</div>

        <div v-else-if="occasions.length === 0" class="p-3 text-sm text-gray-500">
          Noch keine Anlässe vorhanden.
        </div>

        <UTable v-else :data="occasions" :columns="columns">
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
                :disabled="isProtectedOccasion(row.original)"
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
