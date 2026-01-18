<script setup lang="ts">
import { useRoute } from 'vue-router'


const route = useRoute()
const isMobileNavOpen = ref(false)
const user = useSupabaseUser()

const navItems = [
  { label: 'Personen', to: '/people' },
  { label: 'Anlässe', to: '/occasions' },
  { label: 'Geschenkideen', to: '/gifts' }
]

const isActive = (path: string) =>
  route.path === path || route.path.startsWith(path + '/')


const { people } = usePeople()

const today = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const daysFromToday = (iso?: string | null) => {
  if (!iso) return Number.POSITIVE_INFINITY
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY

  const t = today()
  d.setFullYear(t.getFullYear())
  d.setHours(0, 0, 0, 0)

  if (d < t) d.setFullYear(t.getFullYear() + 1)

  const diffMs = d.getTime() - t.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

const birthdaysThisWeek = computed(() => {
  return people.value
    .filter(p => !!p.birthday)
    .map(p => ({ ...p, inDays: daysFromToday(p.birthday) }))
    .filter(p => p.inDays <= 30)
    .sort((a, b) => a.inDays - b.inDays)
})

const birthdayBannerText = computed(() => {
  const n = birthdaysThisWeek.value.length
  if (n === 0) return ''
  if (n === 1) return '1 Geburtstag in den nächsten 30 Tagen'
  return `${n} Geburtstage in den nächsten 30 Tagen`
})

const isBirthdayBannerDismissed = useState<boolean>(
  'birthday_banner_dismissed',
  () => false
)

const showBirthdayBanner = computed(
  () => birthdaysThisWeek.value.length > 0 && !isBirthdayBannerDismissed.value
)

const client = useSupabaseClient()
const signOut = async () => {
  await client.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <header class="border-b border-slate-800 bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 backdrop-blur">
      <nav class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <!-- Logo / Title -->
        <div class="flex items-center gap-3">
         <nuxt-link to="/" class="flex items-center gap-2">
         
            <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Geschenke-Manager
            </span>
          </nuxt-link>
        </div>

        <!-- Desktop Navigation -->
        <div v-if="user" class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="px-3 py-1.5 text-sm rounded-lg transition"
            :class="isActive(item.to)
              ? 'bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100'
              : ' text-slate-900 hover:bg-slate-800 hover:text-white dark:text-gray-100'"
          >
            {{ item.label }}
          </NuxtLink>
          <UButton @click="signOut">Abmelden</UButton>
        </div>

        <!-- Mobile Menu Button -->
        <UButton
          class="md:hidden"
          icon="i-heroicons-bars-3"
          variant="ghost"
          color="neutral"
          @click="isMobileNavOpen = !isMobileNavOpen"
        />
      </nav>

      <!-- Mobile Navigation -->
      <div
        v-if="isMobileNavOpen && user"
        class="md:hidden border-t border-slate-800 bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100"
      >
        <div class="px-4 py-2 flex flex-col gap-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="px-3 py-2 rounded-lg text-sm"
            :class="isActive(item.to)
              ? 'bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 text-white'
              : ' text-slate-900 hover:bg-slate-800 hover:text-white dark:text-gray-100'"
            @click="isMobileNavOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </div>
    </header>

    <div v-if="showBirthdayBanner" class="max-w-6xl mx-auto px-4 pt-4">
      <UAlert
        color="primary"
        variant="soft"
        icon="i-heroicons-cake"
      >
        <template #title>
          {{ birthdayBannerText }}
        </template>

        <template #description>
          <span class="text-sm">
            {{
              birthdaysThisWeek
                .slice(0, 3)
                .map(p => p.name)
                .join(', ')
            }}
            <span v-if="birthdaysThisWeek.length > 3">
              +{{ birthdaysThisWeek.length - 3 }} weitere
            </span>
          </span>
        </template>

        <template #actions>
          <div class="flex gap-2">
            <UButton
              to="/people"
              size="xs"
              color="primary"
              variant="solid"
            >
              Ansehen
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              @click="isBirthdayBannerDismissed = true"
            >
              Ausblenden
            </UButton>
          </div>
        </template>
      </UAlert>
    </div>

    <main class="max-w-6xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
