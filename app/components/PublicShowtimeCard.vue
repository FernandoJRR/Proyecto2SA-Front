<template>
  <article
    class="public-showtime-card w-80 flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div class="relative h-40 bg-slate-200">
      <img
        v-if="posterUrl"
        :src="posterUrl"
        :alt="`Póster de ${movieTitle}`"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-slate-500"
      >
        <i class="pi pi-video text-3xl" aria-hidden="true"></i>
      </div>
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-white"
      >
        <i class="pi pi-spinner pi-spin text-xl" aria-hidden="true"></i>
        <span class="sr-only">Cargando información de la película…</span>
      </div>
    </div>

    <div class="flex h-full flex-col gap-4 p-5">
      <header class="space-y-1">
        <p class="text-xs font-medium uppercase tracking-wide text-primary-600">
          Próxima función
        </p>
        <h3 class="text-lg font-semibold text-slate-900">
          {{ movieTitle }}
        </h3>
        <p v-if="classification" class="text-xs font-medium text-slate-500">
          Clasificación: {{ classification }}
        </p>
        <p v-if="movieDuration" class="text-xs text-slate-500">
          Duración: {{ movieDuration }}
        </p>
      </header>

      <dl class="space-y-2 text-sm text-slate-600">
        <div class="flex items-center justify-between gap-2">
          <dt class="font-medium text-slate-700">Horario</dt>
          <dd class="text-right text-slate-900">{{ schedule }}</dd>
        </div>
        <div class="flex items-center justify-between gap-2">
          <dt class="font-medium text-slate-700">Sala</dt>
          <dd class="text-right text-slate-900">{{ hallName }}</dd>
        </div>
        <div class="flex items-center justify-between gap-2">
          <dt class="font-medium text-slate-700">Disponibles</dt>
          <dd
            class="text-right"
            :class="isSoldOut ? 'text-red-600 font-semibold' : 'text-slate-900'"
          >
            {{ availabilityLabel }}
          </dd>
        </div>
        <div v-if="occupancyLabel" class="flex items-center justify-between gap-2">
          <dt class="font-medium text-slate-700">Ocupados</dt>
          <dd class="text-right text-slate-900">{{ occupancyLabel }}</dd>
        </div>
        <div class="flex items-center justify-between gap-2">
          <dt class="font-medium text-slate-700">Precio</dt>
          <dd class="text-right text-slate-900">{{ ticketPrice }}</dd>
        </div>
      </dl>

      <footer class="mt-auto">
        <p class="text-xs text-slate-500">
          Última actualización: {{ lastUpdated }}
        </p>
        <div
          v-if="errorMessage"
          class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
        >
          {{ errorMessage }}
        </div>
        <div
          v-if="availabilityErrorMessage"
          class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
        >
          {{ availabilityErrorMessage }}
        </div>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCustomQuery } from '~/composables/useCustomQuery'
import { getMovieById, type MovieResponseDTO } from '~/lib/api/movies/movie'
import type { ShowtimeResponseDTO } from '~/lib/api/cinema/showtime'
import { getQuantitySeatsOccupied } from '~/lib/api/ventas/tickets'

const props = defineProps<{
  showtime: ShowtimeResponseDTO
}>()

const showtimeId = computed(() => props.showtime?.id ?? '')
const movieId = computed(() => props.showtime?.cinemaMovie?.movieId ?? '')

const {
  state: movieState,
  asyncStatus: movieAsyncStatus,
} = useCustomQuery({
  key: ['public-showtime-movie', () => movieId.value],
  query: async () => {
    const id = movieId.value
    if (!id) return null
    return getMovieById(id)
  },
})

const movie = computed<MovieResponseDTO | null>(() => {
  const data = movieState.value?.data as MovieResponseDTO | null | undefined
  return data ?? null
})

const {
  state: seatsOccupiedState,
  asyncStatus: seatsOccupiedStatus,
} = useCustomQuery({
  key: ['public-showtime-occupied', () => showtimeId.value],
  query: async () => {
    const id = showtimeId.value
    if (!id) return null
    try {
      const { quantity } = await getQuantitySeatsOccupied(id)
      return quantity
    } catch (error: any) {
      const message =
        error?.data?.message ??
        error?.message ??
        'No se pudo obtener la disponibilidad actual.'
      throw new Error(message)
    }
  },
})

const loading = computed(
  () => movieAsyncStatus?.value === 'loading' && !!movieId.value && !movie.value,
)

const errorMessage = computed(() => {
  const error = movieState.value?.error as { message?: string } | undefined
  return error?.message ?? null
})

const seatsOccupied = computed(() => {
  const data = seatsOccupiedState.value?.data as number | null | undefined
  if (typeof data !== 'number' || Number.isNaN(data)) return null
  return Math.max(0, data)
})

const seatsOccupiedLoading = computed(
  () => seatsOccupiedStatus?.value === 'loading' && !!showtimeId.value,
)

const availabilityErrorMessage = computed(() => {
  const error = seatsOccupiedState.value?.error as { message?: string } | undefined
  return (
    error?.message ??
    (showtimeId.value
      ? 'No se pudo obtener la disponibilidad actualizada. Intenta nuevamente.'
      : null)
  )
})

const movieTitle = computed(() => movie.value?.title ?? 'Película no disponible')
const classification = computed(() => movie.value?.classification?.name ?? null)
const movieDuration = computed(() => {
  const duration = movie.value?.duration
  if (typeof duration !== 'number' || Number.isNaN(duration) || duration <= 0) return null
  return `${duration} min`
})
const posterUrl = computed(() => movie.value?.urlImage ?? '')

const schedule = computed(() => formatShowtimeSchedule(props.showtime))
const hallName = computed(() => props.showtime?.hall?.name ?? 'No disponible')
const hallCapacity = computed(() => {
  const hall = props.showtime?.hall
  if (
    hall &&
    typeof hall.rows === 'number' &&
    typeof hall.columns === 'number'
  ) {
    const capacity = hall.rows * hall.columns
    if (!Number.isNaN(capacity) && capacity >= 0) return capacity
  }
  return null
})

const totalSeats = computed(() => {
  const base = props.showtime?.ticketsAvailable
  if (typeof base === 'number' && !Number.isNaN(base) && base >= 0) {
    return base
  }
  return hallCapacity.value
})

const seatsAvailable = computed(() => {
  const total = totalSeats.value
  if (typeof total !== 'number') return null
  const occupied = seatsOccupied.value ?? 0
  return Math.max(total - occupied, 0)
})

const availabilityLabel = computed(() => {
  const available = seatsAvailable.value
  if (available === null) {
    return seatsOccupiedLoading.value ? 'Calculando…' : 'Sin dato'
  }
  if (available <= 0) return 'Agotada'
  return `${available}`
})

const occupancyLabel = computed(() => {
  const occupied = seatsOccupied.value
  if (occupied === null) return null
  const total = totalSeats.value
  if (typeof total === 'number') return `${occupied}/${total}`
  return `${occupied}`
})

const isSoldOut = computed(() => {
  const available = seatsAvailable.value
  return available !== null && available <= 0
})

const ticketPrice = computed(() => formatCurrency(props.showtime?.price))

const lastUpdated = computed(() => formatDateTime(props.showtime?.endTime ?? props.showtime?.startTime))

function formatDateTime(value?: string | null) {
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

function formatShowtimeSchedule(showtime?: ShowtimeResponseDTO | null) {
  if (!showtime) return 'Horario no disponible'
  const start = formatDateTime(showtime.startTime)
  const end = formatDateTime(showtime.endTime)
  if (start === '—' && end === '—') return 'Horario no disponible'
  if (start === '—') return end
  if (end === '—') return start
  return `${start} – ${end}`
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) return 'Q0.00'
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(value)
}
</script>
