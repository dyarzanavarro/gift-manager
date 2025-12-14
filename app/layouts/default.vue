<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
      <nav class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
<!-- img here-->         
<nuxt-link class="font-medium text-sm" to="/">Geschenke-Manager</nuxt-link>  
        </div>

        <input
          type="text"
          placeholder="Suchen..."
          class="hidden md:block bg-slate-800 text-sm rounded-xl px-3 py-1.5"
        />
      </nav>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>