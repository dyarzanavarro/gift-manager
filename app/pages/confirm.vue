<script setup lang="ts">
const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) navigateTo('/')
})
</script>

<template>
  <UPage>
    <UContainer class="py-10">
      <p>Login wird bestätigt…</p>
    </UContainer>
  </UPage>
</template>
