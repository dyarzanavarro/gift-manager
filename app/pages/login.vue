<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

watchEffect(() => {
  if (user.value) navigateTo('/') // nach Login auf Dashboard
})

const signIn = async () => {
  loading.value = true
  errorMsg.value = null
  successMsg.value = null

  const { error } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  loading.value = false
  if (error) errorMsg.value = error.message
}

const signUp = async () => {
  loading.value = true
  errorMsg.value = null
  successMsg.value = null

  const { error } = await client.auth.signUp({
    email: email.value,
    password: password.value
  })

  loading.value = false
  if (error) {
    errorMsg.value = error.message
  } else {
    successMsg.value = 'Registrierung erfolgreich. Bitte bestätige deine E-Mail (auch im Spam-Ordner nachsehen).'
  }
}
</script>

<template>
  <UPage>
    <UContainer class="max-w-md py-10 space-y-4">
      <h1 class="text-xl font-semibold">Login</h1>

      <UCard class="space-y-3">
        <UInput v-model="email" type="email" placeholder="E-Mail" />
        <UInput v-model="password" type="password" placeholder="Passwort" />

        <div class="flex gap-2">
          <UButton type="button" :loading="loading" color="primary" class="flex-1" @click="signIn">
            Einloggen
          </UButton>
          <UButton type="button" :loading="loading" color="neutral" variant="soft" class="flex-1" @click="signUp">
            Registrieren
          </UButton>
        </div>

        <p v-if="errorMsg" class="text-sm text-red-500">{{ errorMsg }}</p>
        <p v-else-if="successMsg" class="text-sm text-gray-600">{{ successMsg }}</p>
      </UCard>
    </UContainer>
  </UPage>
</template>
