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
      <div
        v-if="seatsOccupiedErrorMessage"
        class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
      >
        {{ seatsOccupiedErrorMessage }} Intenta recargar la información.
      </div>
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

          <Column header="Precio">
            <template #body="{ data }">
              <span class="font-semibold text-slate-900">
                {{ formatCurrency(data.price) }}
              </span>
            </template>
          </Column>

          <Column header="Disponibilidad">
            <template #body="{ data }">
              <div class="flex flex-col gap-1">
                <Tag
                  :value="availabilityTagLabel(data.availability ?? null)"
                  :severity="availabilityTagSeverity(data.availability ?? null)"
                  rounded
                />
                <span
                  v-if="availabilityOccupancyLabel(data.availability ?? null)"
                  class="text-xs text-slate-500"
                >
                  {{ availabilityOccupancyLabel(data.availability ?? null) }}
                </span>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { getShowtimesByCinema, type ShowtimeResponseDTO } from '~/lib/api/cinema/showtime'
import { getMoviesByIds, type MovieResponseDTO } from '~/lib/api/movies/movie'
import { useCustomQuery } from '~/composables/useCustomQuery'
import { getQuantitySeatsOccupied } from '~/lib/api/ventas/tickets'

type ShowtimeAvailabilityInfo = {
  total: number | null
  occupied: number
  available: number | null
  soldOut: boolean
}

type ShowtimeWithDetails = ShowtimeResponseDTO & {
  movie: MovieResponseDTO | null
  availability: ShowtimeAvailabilityInfo | null
}

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

const showtimeIds = computed(() => showtimes.value.map((item) => item.id).filter(Boolean))

const showtimeIdsKey = computed(() => {
  if (!showtimeIds.value.length) return 'empty'
  return [...showtimeIds.value].sort().join('|')
})

const {
  state: seatsOccupiedState,
  asyncStatus: seatsOccupiedStatus,
  refetch: refetchSeatsOccupied,
} = useCustomQuery({
  key: ['cinema-showtimes-occupied', () => showtimeIdsKey.value],
  query: async () => {
    const ids = showtimeIds.value
    if (!ids.length) return {}
    try {
      const responses = await Promise.all(
        ids.map(async (id) => {
          const { quantity } = await getQuantitySeatsOccupied(id)
          return [id, quantity] as const
        })
      )
      return Object.fromEntries(responses)
    } catch (error: any) {
      const message =
        error?.data?.message ??
        error?.message ??
        'No se pudo obtener la ocupación de las funciones.'
      throw new Error(message)
    }
  },
})

const seatsOccupiedData = computed<Record<string, number>>(() => {
  const data = seatsOccupiedState.value.data as Record<string, number> | undefined
  return data ?? {}
})

const seatsOccupiedLoading = computed(() => seatsOccupiedStatus.value === 'loading')

const seatsOccupiedErrorMessage = computed(() => {
  const maybeError = seatsOccupiedState.value.error as { message?: string } | undefined
  if (!maybeError) return null
  return (
    maybeError.message ??
    'No se pudo obtener la ocupación actualizada de las funciones.'
  )
})

const showtimesAvailability = computed(() => {
  const map = new Map<string, ShowtimeAvailabilityInfo>()
  for (const showtime of showtimes.value) {
    const hall = showtime.hall
    const hallCapacity =
      hall &&
      typeof hall.rows === 'number' &&
      typeof hall.columns === 'number'
        ? hall.rows * hall.columns
        : null
    const totalSeats =
      typeof showtime.ticketsAvailable === 'number'
        ? showtime.ticketsAvailable
        : hallCapacity
    const occupied =
      typeof seatsOccupiedData.value[showtime.id] === 'number'
        ? Math.max(seatsOccupiedData.value[showtime.id], 0)
        : 0
    const available =
      typeof totalSeats === 'number' ? Math.max(totalSeats - occupied, 0) : null
    map.set(showtime.id, {
      total: typeof totalSeats === 'number' ? totalSeats : null,
      occupied,
      available,
      soldOut: typeof available === 'number' ? available <= 0 : false,
    })
  }
  return map
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

watch(
  movieIdsKey,
  (value, previous) => {
    if (value === previous) return
    if (value === 'empty') return
    refetchMovies()
  },
  { immediate: false }
)

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
    availability: showtimesAvailability.value.get(showtime.id) ?? null,
  }))
})

const loading = computed(
  () =>
    showtimesStatus.value === 'loading' ||
    moviesStatus.value === 'loading' ||
    seatsOccupiedLoading.value,
)

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

function formatCurrency(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Q0.00'
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(value)
}

function availabilityTagLabel(availability: ShowtimeAvailabilityInfo | null) {
  if (!availability) return 'Sin dato'
  if (availability.available === null) return 'Sin dato'
  if (availability.soldOut) return 'Agotada'
  return `${availability.available} disp.`
}

function availabilityTagSeverity(availability: ShowtimeAvailabilityInfo | null) {
  if (!availability) return 'secondary'
  if (availability.soldOut) return 'danger'
  return 'success'
}

function availabilityOccupancyLabel(availability: ShowtimeAvailabilityInfo | null) {
  if (!availability) return null
  if (typeof availability.total === 'number') {
    return `${availability.occupied}/${availability.total} ocupados`
  }
  return `Ocupados: ${availability.occupied}`
}

async function handleRefresh() {
  await Promise.all([refetchShowtimes(), refetchSeatsOccupied(), refetchMovies()])
}
</script>
