<script setup lang="ts">
import type { GiftStatus, GiftIdea } from '~/models/gift'
import type { Person } from '~/models/person'

const { people } = usePeople()


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

</script>


<template>
 <UPage>
    <UPageHeader
      title="Dashboard"
      description="Überblick über anstehende Geburtstage, offene Geschenkideen und den Weihnachtsstatus."
      class="text-gray-900 dark:text-gray-100"
    />
 <UContainer class="space-y-6">
    <!-- UPCOMING BIRTHDAYS -->
 <!-- Main grid -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Next birthdays -->
        <UCard class="lg:col-span-1">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                    class="p-0 font-medium"
                  >
                    {{ p.name }}
                  </UButton>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ p.dateCH }} · in {{ p.inDays }} Tagen
                  </div>
                </div>
                <UBadge size="xs" color="neutral" variant="soft">
                  🎂
                </UBadge>
              </div>
            </UCard>

            <p v-if="nextBirthdays.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
              Keine Geburtstage in den nächsten 30 Tagen.
            </p>
          </div>
        </UCard>
      </div>
    
 </UContainer>
  </UPage>
</template>