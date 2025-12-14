<script setup lang="ts">
import type { GiftIdea } from '~/models/gift';



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


const onCreate = () => {
  // Logic to open modal for creating a new gift idea
};
</script>


<template>
  <UPage>
    <UPageHeader
      title="Geschenkideen"
      description="Verwalte Geschenkideen, Zuordnungen zu Personen, Anlässen und Status."
    />

    <UContainer class="space-y-6">

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

      </UContainer>
      </UPage>
      </template>