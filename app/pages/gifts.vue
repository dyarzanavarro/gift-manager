<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { GiftIdea, GiftStatus } from '~/models/gift';
import type { SelectItem } from '@nuxt/ui'
import { link } from '#build/ui';



const { gifts, addGift, updateGift, deleteGift } = useGifts();
 
const { people } = usePeople();

//show gift per person
interface GiftRow extends GiftIdea {
  personName: string;
}

const rows = computed<GiftRow[]>(() => {
  const list = gifts.value.map(g => {
    const person = people.value.find(p => p.id === g.personId)
    return {
      ...g,
      personName: person?.name ?? 'Unbekannt'
    }
  })

  // sort after person name and title
  return list.sort((a, b) => {
    const nameCompare = a.personName.localeCompare(b.personName, 'de-CH')
    if (nameCompare !== 0) return nameCompare

    // if same person, sort by title
    return a.title.localeCompare(b.title, 'de-CH')
  })
})

const personItems = computed<SelectItem[]>(() =>
  people.value.map(p => ({
    label: p.name,
    value: p.id
  }))
);

const statusItems: SelectItem[] = [
  { label: 'Idee', value: 'idea' },
  { label: 'Geplant', value: 'planned' },
    { label: 'Gekauft', value: 'bought' },
    { label: 'Überreicht', value: 'given' }
];

const columns: TableColumn<GiftRow>[] = [
  {
    accessorKey: 'title',
    header: 'Geschenkidee'
    },
    {
    accessorKey: 'personName',
    header: 'Person'
    },
    {
    accessorKey: 'occasion',
    header: 'Anlass'
    },
    {
    accessorKey: 'status',
    header: 'Status'
    },
    {
    accessorKey: 'link',
    header: 'Link'
    },
    {
    accessorKey: 'imageUrl',
    header: 'Bild'
    },
   {
    id: 'actions',
    header: 'Aktionen'
  }
]

// Form states and handlers
const isOpen = ref(false);
const isEditing = ref(false);
const editedId = ref<number | null>(null);

type GiftForm = {
  title: string;
    personId: number | null;
    notes: string;
    occasion: string;
    status: GiftStatus;
    link: string;
    imageUrl: string;
};

const form = reactive<GiftForm>({
  title: '',
    personId: null,
    notes: '',
    occasion: '',
    status: 'idea',
    link: '',
    imageUrl: ''
});

const resetForm = () => {
    isEditing.value = false
    editedId.value = null
    form.personId = null
    form.title = ''
    form.notes = ''
    form.occasion = ''
    form.status = 'idea'
    form.link = ''
    form.imageUrl = ''
}

const onCreate = () => {
  resetForm()
  isEditing.value = false
  isOpen.value = true
};

const onEdit = (row: GiftRow) => {
    isEditing.value = true
    editedId.value = row.id
    form.personId = row.personId
    form.title = row.title
    form.notes = row.notes ?? ''
    form.occasion = row.occasion
    form.status = row.status
    form.link = row.link ?? ''
    form.imageUrl = row.imageUrl ?? ''
    isOpen.value = true
}

const onDelete = (row: GiftRow) => {
  if (confirm(`Geschenkidee "${row.title}" wirklich löschen?`)) {
    deleteGift(row.id)
  }
}

const onSubmit = () => {
  if (!form.title.trim()) {
    alert('Bitte einen Titel angeben.')
    return
  }
  if (!form.personId) {
    alert('Bitte eine Person auswählen.')
    return
  }

  const payload: Omit<GiftIdea, 'id'> = {
    personId: form.personId,
    title: form.title.trim(),
    notes: form.notes.trim() || undefined,
    occasion: form.occasion.trim() || 'Allgemein',
    status: form.status,
    link: form.link.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined,
  }

  if (isEditing.value && editedId.value !== null) {
    updateGift(editedId.value, payload)
  } else {
    addGift(payload)
  }

  isOpen.value = false
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

   
       <UCard
       class="bg-white dark:bg-gray-900 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Geschenkideen
            </h2>
               <!-- ACTION BAR -->
      <div class="flex justify-end">
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          variant="solid"
          @click="onCreate"
        >
          Neue Geschenkidee
        </UButton>
      </div>

          </div>    

        </template>

        <UTable :data="rows" :columns="columns">
          <!-- Person -->
          <template #personName-cell="{ row }">
            <span class="text-gray-900 dark:text-gray-100">
              {{ row.original.personName }}
            </span>
          </template>

          <!-- Anlass -->
          <template #occasion-cell="{ row }">
            <span class="text-gray-700 dark:text-gray-300">
              {{ row.original.occasion || '–' }}
            </span>
          </template>

          <!-- Status -->
          <template #status-cell="{ row }">
            <UBadge
              size="xs"
              :color="row.original.status === 'bought'
                  ? 'success'
                  : row.original.status === 'planned'
                  ? 'warning'
                  : 'neutral'"
              variant="soft"
            >
              {{ row.original.status === 'idea'
                  ? 'Idee'
                  : row.original.status === 'planned'
                  ? 'Geplant'
                  : 'Gekauft' }}
            </UBadge>
          </template>

            <!-- Link -->
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

  <!-- Bild -->
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

       <!-- GIFT MODAL & FORM -->
     <UModal v-model:open="isOpen" :ui="{ width: 'sm:max-w-xl' }">
        <template #content>
          <UCard class="w-full max-w-xl mx-auto space-y-4">
            <template #header>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                {{ isEditing ? 'Geschenkidee bearbeiten' : 'Neue Geschenkidee anlegen' }}
              </h3>
            </template>

            <form class="space-y-4" @submit.prevent="onSubmit">
              <!-- Person -->
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

              <!-- Titel -->
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

              <!-- Anlass -->
              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Anlass
                </label>
                <UInput
                  v-model="form.occasion"
                  placeholder="z. B. Geburtstag, Weihnachten"
                  class="w-full"
                />
              </div>

              <!-- Status -->
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

   <!-- Link -->
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

        <!-- Bild-URL -->
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

              <!-- Notizen -->
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