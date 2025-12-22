<script setup lang="ts">


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
    <UCard class="bg-gray-900 shadow-sm">
      <template #header>
        <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
          Anstehende Geburtstage
        </h2>
      </template>

      <div class="p-4">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Hier werden die nächsten Geburtstage deiner Personen angezeigt.
        </p>
      </div>
    </UCard>

    <!-- OPEN GIFT IDEAS -->
    <UCard class="bg-gray-900 shadow-sm">
      <template #header>
        <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
          Offene Geschenkideen
        </h2>
      </template>

      <div class="p-4">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Hier werden deine offenen Geschenkideen angezeigt.
        </p>
      </div>
    </UCard>
    
 </UContainer>
  </UPage>
</template>