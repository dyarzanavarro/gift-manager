<script setup lang="ts">
import type { GiftStatus, GiftIdea } from '~/models/gift'
import type { Person } from '~/models/person'

const { people } = usePeople()
const { gifts } = useGifts()
const { occasions } = useOccasions()

definePageMeta({
  middleware: ['auth']
})

const today = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const formatDateCH = (iso?: string | null) => {
  if (!iso) return '–'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

const daysFromToday = (iso?: string | null) => {
  if (!iso) return Number.POSITIVE_INFINITY
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY
  const t = today()
  d.setFullYear(t.getFullYear()) // birthday this year
  d.setHours(0, 0, 0, 0)
  if (d < t) d.setFullYear(t.getFullYear() + 1) // next year if already passed
  const diffMs = d.getTime() - t.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

const nextBirthdays = computed(() => {
  const list = people.value
    .filter(p => !!p.birthday)
    .map(p => ({
      ...p,
      inDays: daysFromToday(p.birthday),
      dateCH: formatDateCH(p.birthday)
    }))
    .filter(p => p.inDays <= 30)
    .sort((a, b) => a.inDays - b.inDays)

  return list
})

const personNameById = computed(() => {
  const map = new Map<string, string>()
  for (const p of people.value) map.set(p.id, p.name)
  return map
})

const occasionNameById = computed(() => {
  const map = new Map<number, string>()
  for (const o of occasions.value) map.set(o.id, o.name)
  return map
})

type GiftRow = GiftIdea & { personName: string; occasionName: string }

const normalizeGifts = (status: GiftStatus) =>
  gifts.value
    .filter(g => g.status === status)
    .map(g => ({
      ...g,
      personName: personNameById.value.get(g.personId) ?? 'Unbekannt',
      occasionName: occasionNameById.value.get(g.occasionId) ?? 'Unbekannt'
    }))
    .sort((a, b) => {
      const o = a.occasionName.localeCompare(b.occasionName, 'de-CH')
      if (o !== 0) return o
      const p = a.personName.localeCompare(b.personName, 'de-CH')
      if (p !== 0) return p
      return a.title.localeCompare(b.title, 'de-CH')
    })

const openIdeas = computed<GiftRow[]>(() => normalizeGifts('idea').slice(0, 5))
const openPlanned = computed<GiftRow[]>(() => normalizeGifts('planned').slice(0, 5))

const statusLabel = (s: GiftStatus) => {
  switch (s) {
    case 'idea': return 'Idee'
    case 'planned': return 'Geplant'
    case 'bought': return 'Gekauft'
    case 'given': return 'Überreicht'
    default: return s
  }
}

const statusColor = (s: GiftStatus) => {
  switch (s) {
    case 'idea': return 'neutral'
    case 'planned': return 'warning'
    case 'bought': return 'success'
    case 'given': return 'info'
    default: return 'neutral'
  }
}
</script>


<template>
 <UPage class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <UPageHeader
      title="Dashboard"
      description="Überblick über anstehende Geburtstage & offene Geschenkideen."
      class="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100"
    />
 <UContainer class="space-y-6">
    <!-- UPCOMING BIRTHDAYS -->
 <!-- Main grid -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Next birthdays -->
        <UCard class="lg:col-span-1">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-medium text-gray-900 dark:text-gray-100">
                Nächste Geburtstage
              </h2>
              <UButton to="/people" size="xs" color="neutral" variant="ghost">
                Alle
              </UButton>
            </div>
          </template>

          <div class="space-y-2">
            <UCard
              v-for="p in nextBirthdays"
              :key="p.id"
              class="p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <UButton
                    :to="`/people/${p.id}`"
                    variant="ghost"
                    color="primary"
                    class="p-0 font-medium text-2xl"
                  >
                    {{ p.name }}
                  </UButton>
                  <div class="text-xs text-gray-500 dark:text-gray-400 text-lg">
                    {{ p.dateCH }} · in {{ p.inDays }} Tagen
                  </div>
                </div>
                <UBadge size="xl" color="neutral" variant="soft">
                  🎂
                </UBadge>
              </div>
            </UCard>

            <p v-if="nextBirthdays.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
              Keine Geburtstage in den nächsten 30 Tagen.
            </p>
          </div>
        </UCard>

               <!-- Gift ideas (Idee) -->
        <UCard class="lg:col-span-1">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-medium text-gray-900 dark:text-gray-100">
                Geschenkideen (Idee)
              </h2>
           
            </div>
          </template>

          <div class="space-y-2">
            <UCard v-for="g in openIdeas" :key="g.id" class="p-3">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <div class="font-medium text-gray-900 dark:text-gray-100 text-lg">{{ g.title }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ g.personName }} | {{ g.occasionName }}
                  </div>
                </div>

                <UBadge size="xl" :color="statusColor(g.status)" variant="soft">
                  {{ statusLabel(g.status) }}
                </UBadge>
              </div>
            </UCard>

            <p v-if="openIdeas.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
              Keine Geschenkideen im Status "Idee".
            </p>

            <div v-if="gifts.length > 0" class="pt-2">
            
            </div>
          </div>
        </UCard>

        <!-- Gift ideas (Geplant) -->
        <UCard class="lg:col-span-1">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-medium text-gray-900 dark:text-gray-100">
                Geschenkideen (Geplant)
              </h2>
            
            </div>
          </template>

          <div class="space-y-2">
            <UCard v-for="g in openPlanned" :key="g.id" class="p-3">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <div class="font-medium text-gray-900 dark:text-gray-100 text-lg">{{ g.title }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ g.personName }} | {{ g.occasionName }}
                  </div>
                </div>

                <UBadge size="xl" :color="statusColor(g.status)" variant="soft">
                  {{ statusLabel(g.status) }}
                </UBadge>
              </div>
            </UCard>

            <p v-if="openPlanned.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
              Keine Geschenkideen im Status "Geplant".
            </p>

            <div v-if="gifts.length > 0" class="pt-2">
              <UButton to="/gifts" color="primary" variant="soft" size="sm">
                Alle Geschenkideen anzeigen
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

    </UContainer>
  </UPage>

</template>
