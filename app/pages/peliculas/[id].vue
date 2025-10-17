<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
    <main class="max-w-7xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-5 lg:gap-6">
        <div class="rounded-xl overflow-hidden border border-slate-200 bg-white">
          <div class="aspect-[2/3] bg-slate-200 animate-pulse" />
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-6">
          <div class="h-8 w-2/3 bg-slate-200 rounded animate-pulse mb-4" />
          <div class="h-4 w-1/3 bg-slate-200 rounded animate-pulse mb-6" />
          <div class="space-y-3">
            <div class="h-4 bg-slate-200 rounded animate-pulse" />
            <div class="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
            <div class="h-4 bg-slate-200 rounded animate-pulse w-4/6" />
          </div>
        </div>
      </div>

      <!-- Not found -->
      <div v-else-if="!movie" class="flex flex-col items-center justify-center py-24 text-center">
        <i class="pi pi-exclamation-circle text-4xl mb-3 text-slate-400" aria-hidden="true"></i>
        <h2 class="text-lg font-semibold text-slate-800">Película no encontrada</h2>
        <p class="text-slate-600 mb-6">La película solicitada no existe o fue desactivada.</p>
        <Button label="Volver a cartelera" icon="pi pi-arrow-left" @click="goList" />
      </div>

      <!-- Content -->
      <div v-else class="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-5 lg:gap-6">
        <!-- Poster -->
        <aside class="rounded-xl overflow-hidden border border-slate-200 bg-white">
          <div class="aspect-[2/3] bg-slate-100">
            <img
              :src="movie.urlImage || placeholder"
              :alt="movie.title"
              class="w-full h-full object-cover"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </div>
        </aside>

        <!-- Info -->
        <section class="rounded-xl border border-slate-200 bg-white p-5 lg:p-6 text-[15px] leading-6">
          <header class="mb-4">
            <h1 class="text-2xl lg:text-[26px] font-extrabold tracking-tight text-slate-900">
              {{ movie.title }}
            </h1>
            <p class="text-slate-600 mt-1">
              {{ movie.duration }} min ·
              <span v-if="movie.classification?.name">Clasificación {{ movie.classification?.name }}</span>
              <span v-else>Clasificación —</span>
            </p>
          </header>

          <!-- Categories -->
          <div v-if="movie.categories?.length" class="flex flex-wrap gap-2 mb-6">
            <Tag
              v-for="c in movie.categories"
              :key="c.id"
              :value="c.name"
              rounded
              severity="info"
            />
          </div>

          <Divider />

          <!-- Synopsis -->
          <section class="mb-6">
            <h2 class="text-base font-semibold text-slate-800 mb-2">Sinopsis</h2>
            <p class="text-slate-700 whitespace-pre-line">
              {{ movie.sinopsis }}
            </p>
          </section>

          <!-- Crew -->
          <section class="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 class="text-base font-semibold text-slate-800 mb-2">Dirección</h3>
              <p class="text-slate-700">{{ movie.director || '—' }}</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800 mb-2">Reparto</h3>
              <ul class="text-slate-700 list-disc pl-5 space-y-1">
                <li v-for="(actor, idx) in castingList" :key="idx">{{ actor }}</li>
              </ul>
            </div>
          </section>

          <Divider class="my-6" />

          <!-- Actions -->
          <div class="flex flex-wrap items-center gap-3">
            <Button icon="pi pi-arrow-left" label="Volver a cartelera" outlined @click="goList" />
            <Button
              icon="pi pi-ticket"
              label="Ver cines con funciones"
              @click="goCinemas"
            />
          </div>

          <!-- Meta -->
          <div class="mt-6 text-xs text-slate-500">
            Actualizado: {{ formatDate(movie.updatedAt) }}
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import { getMovieById, type MovieResponseDTO } from '~/lib/api/movies/movie'
// Ajusta la ruta según tu estructura real


const route = useRoute()
const router = useRouter()

const loading = ref(true)
const movie = ref<MovieResponseDTO | null>(null)
const castingList = computed(() => {
  const raw = movie.value?.casting || ''
  // admite saltos de línea y guiones
  return raw
    .split(/\r?\n/)
    .map(s => s.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
})

const placeholder =
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop'

async function loadMovie() {
  loading.value = true
  try {
    const id = String(route.params.id)
    const resp = await getMovieById(id)
    movie.value = resp
    useHead({ title: `${resp.title} · Película` })
  } catch (e) {
    movie.value = null
  } finally {
    loading.value = false
  }
}

function goList() {
  router.push('/peliculas')
}

function goCinemas() {
  // puedes ajustar esta ruta cuando tengas página de funciones por cine
  router.push('/#cines')
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

onMounted(loadMovie)
watch(() => route.params.id, () => loadMovie())
</script>

<style scoped>
/* No custom styles needed for now */
</style>