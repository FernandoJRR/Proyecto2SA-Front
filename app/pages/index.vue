<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <!-- Page Header -->
    <header class="max-w-7xl mx-auto mb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Cartelera y Cines
          </h1>
          <p class="text-slate-600">
            Explora las películas disponibles y los cines donde puedes verlas.
          </p>
        </div>

      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto" role="main">
      <!-- Meta: count -->
      <div class="flex items-center justify-between mb-4 text-sm text-slate-600">
        <div v-if="!pending">
          <span class="font-semibold">{{ totalMovies }}</span>
          {{ totalMovies === 1 ? 'película' : 'películas' }} en cartelera ·
          <span class="font-semibold">{{ filteredCinemas.length }}</span>
          {{ filteredCinemas.length === 1 ? 'cine' : 'cines' }}
        </div>
        <div v-else class="text-slate-500">Cargando cartelera…</div>
      </div>

      <!-- Grid of Cinemas -->
      <div
        v-if="filteredCinemas.length"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <section
          v-for="cinema in filteredCinemas"
          :key="cinema.id"
          class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <!-- Cinema header -->
          <div class="p-5 border-b border-slate-100">
            <h2 class="text-lg font-bold text-slate-900">{{ cinema.name }}</h2>
            <p class="text-slate-600 text-sm">
              {{ cinema.address }} · {{ cinema.rooms }} salas
            </p>
          </div>

          <!-- Now Playing -->
          <div class="p-5">
            <h3 class="text-sm font-semibold text-slate-800 mb-3">En este cine</h3>

            <div v-if="cinema.nowPlaying &amp;&amp; cinema.nowPlaying.length" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <article
                v-for="movie in cinema.nowPlaying"
                :key="movie.id"
                class="group rounded-lg border border-slate-200 hover:shadow-md transition overflow-hidden bg-slate-50"
              >
                <NuxtLink :to="`/peliculas/${movie.id}`" class="block">
                  <div class="aspect-[2/3] bg-slate-200 overflow-hidden">
                    <img
                      :src="movie.urlImage"
                      :alt="movie.title"
                      class="w-full h-full object-cover group-hover:scale-[1.02] transition"
                      loading="lazy"
                    />
                  </div>
                  <div class="p-3">
                    <h4 class="text-sm font-semibold text-slate-900 line-clamp-2">
                      {{ movie.title }}
                    </h4>
                    <p class="text-xs text-slate-600 mt-1">
                      {{ movie.duration }} min · {{ movie.classification?.name || 'Clasificación' }}
                    </p>
                  </div>
                </NuxtLink>
              </article>
            </div>

            <div v-else class="text-sm text-slate-500">Sin funciones asignadas.</div>
          </div>
        </section>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <i class="pi pi-inbox text-4xl mb-3 text-slate-400" aria-hidden="true"></i>
        <h2 class="text-lg font-semibold text-slate-800">No hay resultados</h2>
        <p class="text-slate-600">Intenta con otro término de búsqueda.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">

/**
 * Tipos que reflejan el DTO del backend (MovieResponseDTO).
 * Se definen aquí para tipado en el frontend.
 */
type UUID = string

interface ClassificationViewResponseDTO {
  id: UUID
  name: string
  code?: string
}

interface CategoryViewResponseDTO {
  id: UUID
  name: string
}

interface MovieResponseDTO {
  id: UUID
  title: string
  duration: number
  sinopsis: string
  classificationId: UUID
  director: string
  casting: string
  urlImage: string
  active: boolean
  createdAt: string
  updatedAt: string
  classification?: ClassificationViewResponseDTO | null
  categories: CategoryViewResponseDTO[]
}

/** Modelo para cines (datos falsos mientras tanto). */
interface Cinema {
  id: string
  name: string
  address: string
  rooms: number
  nowPlayingIds: UUID[] // IDs de películas asignadas a este cine
}

/** Búsqueda */
const q = ref('')

/** Películas desde el backend (usa tu endpoint real si es distinto). */
const { data: movies, pending } = useFetch<MovieResponseDTO[]>('/api/movies', {
  default: () => [],
})

/** Datos falsos de cines (puedes mover esto a un JSON o API luego). */
const cinemas = reactive<Cinema[]>([
  {
    id: 'cin-1',
    name: 'Cine Xela Centro',
    address: 'Zona 1, Quetzaltenango',
    rooms: 6,
    nowPlayingIds: [],
  },
  {
    id: 'cin-2',
    name: 'Cine Utatlán',
    address: 'Centro Comercial Utatlán',
    rooms: 8,
    nowPlayingIds: [],
  },
  {
    id: 'cin-3',
    name: 'Cine Interplaza',
    address: 'Interplaza Xela',
    rooms: 5,
    nowPlayingIds: [],
  },
])

/**
 * Asigna de forma simple algunas películas a cada cine (mientras tanto).
 * Cuando lleguen las funciones reales, reemplaza por showtimes desde el backend.
 */
watchEffect(() => {
  const list = movies.value || []
  if (!list.length) return

  cinemas.forEach((c, idx) => {
    // Selección determinística pero simple: alterna películas por índice
    const step = Math.max(1, Math.floor(list.length / (2 + (idx % 2))))
    c.nowPlayingIds = list.filter((_, i) => (i + idx) % step === 0).slice(0, 6).map(m => m.id)
  })
})

/** Cinemas con las películas resueltas */
const cinemasResolved = computed(() => {
  const map = new Map((movies.value || []).map(m => [m.id, m]))
  return cinemas.map(c => ({
    ...c,
    nowPlaying: c.nowPlayingIds.map(id => map.get(id)).filter(Boolean) as MovieResponseDTO[],
  }))
})

/** Búsqueda por texto sobre cines y películas */
const filteredCinemas = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return cinemasResolved.value

  return cinemasResolved.value
    .map(c => {
      const inCinema = c.name.toLowerCase().includes(term) || c.address.toLowerCase().includes(term)
      const moviesMatched = c.nowPlaying.filter(m =>
        m.title.toLowerCase().includes(term) ||
        (m.classification?.name?.toLowerCase() || '').includes(term)
      )
      return inCinema ? { ...c, nowPlaying: c.nowPlaying } : { ...c, nowPlaying: moviesMatched }
    })
    .filter(c => c.nowPlaying.length > 0 || c.name.toLowerCase().includes(term))
})

/** Total de películas únicas mostradas (para el meta de la vista) */
const totalMovies = computed(() => {
  const set = new Set<UUID>()
  filteredCinemas.value.forEach(c => c.nowPlaying.forEach(m => set.add(m.id)))
  return set.size
})
</script>
