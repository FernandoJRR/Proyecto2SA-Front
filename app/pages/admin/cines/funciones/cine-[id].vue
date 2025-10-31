<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-7xl mx-auto mb-6" role="banner">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/cines">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al listado de cines" />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Funciones del cine
            </h1>
            <p class="text-sm text-slate-600" aria-live="polite">
              {{ cinemaTitle }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            icon="pi pi-refresh"
            label="Recargar"
            size="small"
            severity="secondary"
            text
            :loading="loading"
            @click="handleRefresh"
          />
        </div>
        <RouterLink :to="`/admin/cines/funciones/crear?cineId=${cinemaId}`">
          <Button icon="pi pi-plus" label="Agregar función" rounded raised aria-label="Agregar nueva función al cine" />
        </RouterLink>
      </div>
    </header>

    <main class="max-w-7xl mx-auto" role="main">
      <div class="rounded-xl border border-slate-200 bg-white">
        <DataTable
          :value="rows"
          dataKey="id"
          tableStyle="min-width: 65rem"
          stripedRows
          rowHover
          :loading="loading"
          :paginator="rows.length > 10"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
        >
          <template #empty>
            <div class="py-10 text-center text-slate-600">
              <i class="pi pi-inbox text-3xl mb-2 text-slate-400" aria-hidden="true"></i>
              <div>{{ emptyMessage }}</div>
            </div>
          </template>

          <template #loading>
            <div class="py-10 text-center text-slate-600">
              Cargando funciones…
            </div>
          </template>

          <Column header="Película">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-semibold text-slate-900">
                  {{ data.movie?.title ?? 'Película no disponible' }}
                </span>
                <span class="text-xs text-slate-600">
                  {{ data.movie?.duration ? `${data.movie.duration} min` : 'Duración no disponible' }}
                </span>
              </div>
            </template>
          </Column>

          <Column header="Clasificación">
            <template #body="{ data }">
              <Tag
                v-if="data.movie?.classification?.name"
                :value="data.movie.classification.name"
                severity="info"
                rounded
              />
              <span v-else>—</span>
            </template>
          </Column>

          <Column header="Sala">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-semibold text-slate-900">
                  {{ data.hall?.name ?? 'Sala no disponible' }}
                </span>
                <span class="text-xs text-slate-600">
                  Capacidad: {{ data.hall ? data.hall.rows * data.hall.columns : '—' }}
                </span>
              </div>
            </template>
          </Column>

          <Column field="startTime" header="Inicio" sortable>
            <template #body="{ data }">
              {{ formatDateTime(data.startTime) }}
            </template>
          </Column>

          <Column field="endTime" header="Fin" sortable>
            <template #body="{ data }">
              {{ formatDateTime(data.endTime) }}
            </template>
          </Column>

          <Column header="Tickets disponibles">
            <template #body="{ data }">
              <Tag
                :value="String(data.ticketsAvailable ?? 0)"
                severity="secondary"
                rounded
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { getShowtimesByCinema, type ShowtimeResponseDTO } from '~/lib/api/cinema/showtime'
import { getMoviesByIds, type MovieResponseDTO } from '~/lib/api/movies/movie'
import { useCustomQuery } from '~/composables/useCustomQuery'

type ShowtimeWithDetails = ShowtimeResponseDTO & { movie: MovieResponseDTO | null }

const route = useRoute()
const cinemaId = computed(() => String(route.params.id ?? ''))

const { state: cinemaState } = useCustomQuery({
  key: ['cinema-for-showtimes', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) throw new Error('Identificador del cine no disponible.')
    return getCinemaById(id)
  },
})

const {
  state: showtimesState,
  asyncStatus: showtimesStatus,
  refetch: refetchShowtimes,
} = useCustomQuery({
  key: ['cinema-showtimes', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) throw new Error('Identificador del cine no disponible.')
    return getShowtimesByCinema(id)
  },
})

const showtimes = computed<ShowtimeResponseDTO[]>(() => {
  const data = showtimesState.value.data as ShowtimeResponseDTO[] | undefined
  return data ?? []
})

const movieIds = computed(() => {
  const ids = new Set<string>()
  for (const showtime of showtimes.value) {
    const movieId = showtime.cinemaMovie?.movieId
    if (movieId) ids.add(movieId)
  }
  return Array.from(ids)
})

const movieIdsKey = computed(() => {
  if (!movieIds.value.length) return 'empty'
  return [...movieIds.value].sort().join('|')
})

const {
  state: moviesState,
  asyncStatus: moviesStatus,
  refetch: refetchMovies,
} = useCustomQuery({
  key: ['showtime-movies', () => movieIdsKey.value],
  query: async () => {
    const ids = movieIds.value
    if (!ids.length) return []
    return getMoviesByIds(ids)
  },
})

const moviesById = computed(() => {
  const data = moviesState.value.data as MovieResponseDTO[] | undefined
  const map = new Map<string, MovieResponseDTO>()
  if (data) {
    for (const movie of data) {
      map.set(movie.id, movie)
    }
  }
  return map
})

const rows = computed<ShowtimeWithDetails[]>(() => {
  return showtimes.value.map((showtime) => ({
    ...showtime,
    movie: moviesById.value.get(showtime.cinemaMovie?.movieId ?? '') ?? null,
  }))
})

const loading = computed(() => showtimesStatus.value === 'loading' || moviesStatus.value === 'loading')

const cinemaTitle = computed(() => {
  const stateValue = cinemaState.value
  if (stateValue.status === 'pending') return 'Cargando información del cine…'
  if (stateValue.status === 'error') return 'No se pudo cargar la información del cine.'
  const data = stateValue.data as CinemaResponseDTO | undefined
  return data ? `Gestionar funciones de ${data.name}` : 'Cine no encontrado.'
})

const showtimesStateStatus = computed(() => showtimesState.value.status)
const emptyMessage = computed(() =>
  showtimesStateStatus.value === 'error'
    ? 'No fue posible cargar las funciones. Intenta recargar.'
    : 'Este cine aún no tiene funciones programadas.'
)

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-GT', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleRefresh() {
  await Promise.all([refetchShowtimes(), refetchMovies()])
}
</script>
