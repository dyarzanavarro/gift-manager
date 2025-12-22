<script setup lang="ts">
import type { Person } from '~/models/person'
import type { GiftIdea } from '~/models/gift'

const route = useRoute()

const personId = computed(() => Number(route.params.id))

const { people } = usePeople()
const { gifts, deleteGift } = useGifts()
const { occasions } = useOccasions()

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
</script>

<template>
  <UPage>
    <UPageHeader
      :title="person ? person.name : 'Person nicht gefunden'"
      :description="person?.birthday ? `Geburtstag: ${person.birthday}` : 'Kein Geburtstag gespeichert'"
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
            :to="`/gifts?personId=${person.id}`"
            color="primary"
            icon="i-heroicons-plus"
          >
            Geschenkidee hinzufügen
          </UButton>

          <UButton to="/people" color="neutral" variant="soft">
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
                  <p class="font-medium">{{ g.title }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ g.occasionName }}</p>
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
    </UContainer>
  </UPage>
</template>
