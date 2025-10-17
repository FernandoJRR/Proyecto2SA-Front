<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <header class="max-w-7xl mx-auto mb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
        Películas disponibles
      </h1>
      <p class="text-slate-600">Consulta la cartelera completa. 20 por página.</p>
    </header>

    <!-- Grid -->
    <main class="max-w-7xl mx-auto">
      <!-- Skeletons while loading -->
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-5">
        <div v-for="n in 20" :key="n" class="rounded-xl overflow-hidden border border-slate-200 bg-white">
          <div class="aspect-[2/3] bg-slate-200 animate-pulse" />
          <div class="p-3 space-y-2">
            <div class="h-4 bg-slate-200 rounded animate-pulse" />
            <div class="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>

      <!-- Movies grid -->
      <div
        v-else-if="movies.length"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-5"
      >
        <NuxtLink
          v-for="m in movies"
          :key="m.id"
          :to="`/peliculas/${m.id}`"
          class="group rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition"
        >
          <div class="aspect-[2/3] bg-slate-100 overflow-hidden">
            <img
              :src="m.urlImage || placeholder"
              :alt="m.title"
              class="w-full h-full object-cover group-hover:scale-[1.02] transition"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </div>
          <div class="p-3">
            <h2 class="text-sm font-semibold text-slate-900 line-clamp-2">{{ m.title }}</h2>
            <p class="text-xs text-slate-600 mt-1">
              {{ m.duration }} min
            </p>
            <p class="text-xs text-slate-600 mt-1">
              {{ m.classification?.name || '—' }} · {{ m.classification?.description || '—' }}
            </p>
            <p class="text-xs text-slate-600 mt-1">
              {{m.categories?.map(c => c.name).join(', ') || '—' }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-16 text-center text-slate-600">
        <i class="pi pi-inbox text-3xl mb-3 text-slate-400" aria-hidden="true"></i>
        No hay películas disponibles por ahora.
      </div>

      <!-- Pagination -->
      <div class="mt-8 flex justify-center">
        <Paginator
          :rows="PAGE_SIZE"
          :totalRecords="totalElements"
          :first="page * PAGE_SIZE"
          :rowsPerPageOptions="[]"
          @page="onPage"
          :template="{
            layout: 'PrevPageLink PageLinks NextPageLink',
            PrevPageLink: 'PrevPageLink',
            NextPageLink: 'NextPageLink',
            PageLinks: 'PageLinks'
          }"
        />
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import Paginator from 'primevue/paginator'
import { getAllPaginated, type MovieResponseDTO } from '~/lib/api/movies/movie'
// Ajusta la ruta del import según la ubicación real de tus funciones:


const PAGE_SIZE = 20

const page = ref(0)
const loading = ref(true)
const movies = ref<MovieResponseDTO[]>([])
const totalElements = ref(0)
const placeholder =
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop' // póster genérico

async function loadPage(p: number) {
  loading.value = true
  try {
    const resp = await getAllPaginated(p)
    movies.value = resp.content
    totalElements.value = resp.totalElements
    page.value = resp.number
  } catch (e) {
    movies.value = []
    totalElements.value = 0
  } finally {
    loading.value = false
  }
}

function onPage(e: any) {
  // e.page es 0-based
  if (e?.page !== undefined && e.page !== page.value) {
    loadPage(e.page)
    // scroll suave al inicio del grid
    if (process.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  loadPage(0)
})
</script>

<style scoped>
/* opcional: ajuste de enlaces de paginación para una vista más limpia */
:deep(.p-paginator) {
  background-color: transparent;
  border: 0;
}
:deep(.p-paginator .p-paginator-pages .p-paginator-page) {
  border-radius: 0.375rem; /* md */
}
</style>