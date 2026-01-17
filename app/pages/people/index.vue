<script setup lang="ts">
import type { Person } from '~/models/person';
import { usePeople } from '~/composables/usePeople';
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ middleware: ['auth'] })

const columns: TableColumn<Person>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'birthday',
    header: 'Geburtstag'
  },
  {
    accessorKey: 'notes',
    header: 'Notizen'
  },
  {
    id: 'actions',          
    header: 'Aktionen'
  }
]
const { people, loading, error, fetchPeople, addPerson, updatePerson, deletePerson } = usePeople()

const isOpen = ref(false)
const isEditing = ref(false)
const editedId = ref<string | null>(null) 
  
const form = reactive<Omit<Person, 'id'>>({
  name: '',
  birthday: '',
  notes: ''
})

onMounted(() => {
  fetchPeople()
})

const resetForm = () => {
  isEditing.value = false;
  editedId.value = null;
  form.name = "";
  form.birthday = "";
  form.notes = "";
};

const onCreate = () => {
  resetForm();
  isEditing.value = false;
  isOpen.value = true;
};

const onEdit = (person: Person) => {
  isEditing.value = true;
  editedId.value = person.id;
  form.name = person.name;
  form.birthday = person.birthday ?? "";
  form.notes = person.notes ?? "";
  isOpen.value = true;
};

const onSubmit = async () => {
  try {
    if (isEditing.value && editedId.value !== null) {
      await updatePerson(editedId.value, { ...form })
    } else {
      await addPerson({ ...form })
    }
    isOpen.value = false
  } catch (err: any) {
    alert(err.message ?? 'Speichern fehlgeschlagen.')
  }
}

const onDelete = async (p: Person) => {
  if (!confirm(`Person "${p.name}" wirklich löschen?`)) return
  try {
    await deletePerson(p.id)
  } catch (err: any) {
    alert(err.message ?? 'Löschen fehlgeschlagen.')
  }
}

const formatBirthday = (value?: string) => {
  if (!value) return '–';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value; // fallback
  return date.toLocaleDateString('de-CH');
};

</script>

<template>
  <UPage class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
     <UPageHeader title="Personenverwaltung" description="Verwalte Personen, Geburtstage und Notizen." />
    <UContainer class="space-y-6">
      <UAlert v-if="error" color="error" variant="soft" icon="i-heroicons-exclamation-circle">
        {{ error }}
      </UAlert>


      <!-- PERSON TABLE -->
      <UCard
             class="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Personen
            </h2>
            <div class="flex justify-end">
              <UButton
                icon="i-heroicons-plus"
                color="primary"
                class="font-bold"
                variant="solid"
                @click="onCreate"
              >
                Neue Person
              </UButton>
            </div>
          </div>
        </template>

                <div v-if="loading" class="p-3 text-sm text-gray-500">Lade Personen…</div>

        <UTable v-else :data="people" :columns="columns">
          <template #name-cell="{ row }">
  <UButton
    :to="`/people/${row.original.id}`"
    variant="ghost"
    color="primary"
    class="p-0 font-medium"
  >
    {{ row.original.name }}
  </UButton>
</template>
          <!-- Geburtstag -->
          <template #birthday-cell="{ row }">
            <span v-if="row.original.birthday">
              {{ formatBirthday(row.original.birthday) }}
            </span>
            <span
              v-else
              class="italic text-gray-500 dark:text-gray-400"
            >
              –
            </span>
          </template>

          <!-- Notizen -->
          <template #notes-cell="{ row }">
            <span class="text-gray-700 dark:text-gray-300">
              {{ row.original.notes || '–' }}
            </span>
          </template>

          <!-- Aktionen -->
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

      <!-- PERSON MODAL & FORM -->
      <UModal v-model:open="isOpen" :ui="{ width: 'sm:max-w-xl' }">
        <template #content>
          <UCard class="w-full max-w-xl mx-auto space-y-4 max-h-[80vh] overflow-y-auto">
            <template #header>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                {{ isEditing ? 'Person bearbeiten' : 'Neue Person anlegen' }}
              </h3>
            </template>

            <form class="space-y-4" @submit.prevent="onSubmit">
              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <UInput
                  v-model="form.name"
                  placeholder="Name eingeben"
                  class="w-full"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Geburtstag
                </label>
                <UInput
                  v-model="form.birthday"
                  type="date"
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
                  placeholder="Vorlieben, No-Gos, Hinweise..."
                  class="w-full"
                />
              </div>

              <div class="flex justify-end gap-2 pt-3">
                <UButton
                  color="gray"
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
