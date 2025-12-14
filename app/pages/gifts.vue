<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { GiftIdea, GiftStatus } from '~/models/gift';



const { gifts, addGift, updateGift, deleteGift } = useGifts();
const { people } = usePeople();

//show gift per person
interface GiftRow extends GiftIdea {
  personName: string;
}

const rows = computed<GiftRow[]>(() => {
  return gifts.value.map(g => {
    const person = people.value.find(p => p.id === g.personId);
    return {
      ...g,
      personName: person ? person.name : 'Unbekannt'
    };
  });
});

const personOptions = computed(() => 
    people.value.map(p => ({
        label: p.name,
        value: p.id
    }))
);

const statusOptions = [
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
};

const form = reactive<GiftForm>({
  title: '',
    personId: null,
  notes: '',
  occasion: '',
    status: 'idea'
});

const resetForm = () => {
  isEditing.value = false
  editedId.value = null
  form.personId = null
  form.title = ''
  form.notes = ''
  form.occasion = ''
  form.status = 'idea'
}

const onCreate = () => {
  resetForm()
  isEditing.value = false
  isOpen.value = true
};

// TODO: implement edit and delete handlers and onSubmit function
</script>


<template>
  <UPage>
    <UPageHeader
      title="Geschenkideen"
      description="Verwalte Geschenkideen, Zuordnungen zu Personen, Anlässen und Status."
    />

    <UContainer class="space-y-6">

   
       <UCard>
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
             <!-- ACTION BAR -->
      

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

          <!-- Aktionen -->
       
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
          </UCard>
        </template>
      </UModal>

      </UContainer>
      </UPage>
      </template>