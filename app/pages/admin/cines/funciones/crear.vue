<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-3xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink :to="`/admin/cines/funciones/cine-${cinemaId}`">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al listado de funciones" />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Crear función
            </h1>
            <p class="text-sm text-slate-600">
              {{ cinemaTitle }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto" role="main">
      <div class="rounded-2xl border border-slate-200 bg-white shadow">
        <form class="p-6 sm:p-8 space-y-6" @submit.prevent="onSubmit">
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="cinemaMovie">
                Película asignada *
              </label>
              <Dropdown
                id="cinemaMovie"
                v-model="selectedCinemaMovie"
                :options="cinemaMovieOptions"
                optionLabel="movieTitle"
                :loading="cinemaMoviesLoading"
                :placeholder="cinemaMoviePlaceholder"
                :disabled="cinemaMoviesLoading || !cinemaMovieOptions.length"
                class="w-full"
                filter
                showClear
              >
                <template #value="{ value }">
                  <div v-if="value" class="flex flex-col">
                    <span class="font-semibold text-slate-900">{{ value.movieTitle }}</span>
                    <span class="text-xs text-slate-600">
                      {{ value.movieDuration }}
                    </span>
                  </div>
                  <span v-else>{{ cinemaMoviePlaceholder }}</span>
                </template>
                <template #option="{ option }">
                  <div class="flex flex-col">
                    <span class="font-semibold text-slate-900">{{ option.movieTitle }}</span>
                    <span class="text-xs text-slate-600">
                      {{ option.movieDuration }}
                    </span>
                  </div>
                </template>
              </Dropdown>
              <p v-if="errors.cinemaMovie" class="mt-1 text-sm text-red-600">
                {{ errors.cinemaMovie }}
              </p>
              <p class="mt-2 text-xs text-slate-500">
                Debes seleccionar una película previamente asociada al cine. Solo se muestran las relaciones activas.
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="hall">
                Sala *
              </label>
              <Dropdown
                id="hall"
                v-model="selectedHall"
                :options="hallOptions"
                optionLabel="name"
                :loading="hallsLoading"
                :placeholder="hallPlaceholder"
                :disabled="hallsLoading || !hallOptions.length"
                class="w-full"
                filter
                showClear
              >
                <template #value="{ value }">
                  <div v-if="value" class="flex flex-col">
                    <span class="font-semibold text-slate-900">{{ value.name }}</span>
                    <span class="text-xs text-slate-600">
                      Capacidad: {{ value.rows * value.columns }}
                    </span>
                  </div>
                  <span v-else>{{ hallPlaceholder }}</span>
                </template>
                <template #option="{ option }">
                  <div class="flex flex-col">
                    <span class="font-semibold text-slate-900">{{ option.name }}</span>
                    <span class="text-xs text-slate-600">
                      Capacidad: {{ option.rows * option.columns }}
                    </span>
                  </div>
                </template>
              </Dropdown>
              <p v-if="errors.hall" class="mt-1 text-sm text-red-600">
                {{ errors.hall }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="startTime">
                  Inicio *
                </label>
                <Calendar
                  id="startTime"
                  v-model="startTime"
                  showTime
                  hourFormat="24"
                  :manualInput="false"
                  :minDate="minDate"
                  class="w-full"
                />
                <p v-if="errors.startTime" class="mt-1 text-sm text-red-600">
                  {{ errors.startTime }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="endTime">
                  Fin (calculado)
                </label>
                <InputText
                  id="endTime"
                  :value="formattedEndTime"
                  class="w-full"
                  readonly
                  placeholder="Selecciona una película y un horario de inicio"
                />
                <p class="mt-1 text-xs text-slate-500">
                  La hora de fin se calcula automáticamente con la duración de la película.
                </p>
                <p v-if="errors.endTime" class="mt-1 text-sm text-red-600">
                  {{ errors.endTime }}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-1">
            <p>
              <span class="font-semibold text-slate-800">Película seleccionada:</span>
              {{ selectedCinemaMovie?.movieTitle ?? '—' }}
            </p>
            <p>
              <span class="font-semibold text-slate-800">Sala:</span>
              {{ selectedHall?.name ?? '—' }}
            </p>
            <p>
              <span class="font-semibold text-slate-800">Horario:</span>
              {{ formattedSummary }}
            </p>
          </div>

          <div class="flex items-center justify-end gap-3">
            <RouterLink :to="`/admin/cines/funciones/cine-${cinemaId}`">
              <Button type="button" label="Cancelar" severity="secondary" outlined />
            </RouterLink>
            <Button
              type="submit"
              label="Crear función"
              icon="pi pi-save"
              :loading="submitting"
              :disabled="submitting"
            />
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import InputText from 'primevue/inputtext'
import { toast } from 'vue-sonner'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import {
  getCarteleraActivaCine,
  type CinemaMovieResponseDTO,
} from '~/lib/api/cinema/cinema-movie'
import {
  getCinemaHallsByCinemaId,
  type CinemaHallResponseDTO,
} from '~/lib/api/cinema/hall'
import { createShowtime } from '~/lib/api/cinema/showtime'
import { getMoviesByIds, type MovieResponseDTO } from '~/lib/api/movies/movie'
import { useCustomQuery } from '~/composables/useCustomQuery'

type CinemaMovieOption = CinemaMovieResponseDTO & {
  movie: MovieResponseDTO | null
  movieTitle: string
  movieDuration: string
}

const route = useRoute()
const router = useRouter()

const cinemaId = computed(() => {
  const value = route.query.cineId
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? ''
  return ''
})

const { state: cinemaState } = useCustomQuery({
  key: ['cinema-for-showtime-create', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) throw new Error('Identificador del cine no disponible.')
    return getCinemaById(id)
  },
})

const cinemaTitle = computed(() => {
  const stateValue = cinemaState.value
  if (stateValue.status === 'pending') return 'Cargando información del cine…'
  if (stateValue.status === 'error') return 'No se pudo cargar la información del cine.'
  const data = stateValue.data as CinemaResponseDTO | undefined
  return data ? `Cine: ${data.name}` : 'Cine no encontrado.'
})

const {
  state: cinemaMoviesState,
  asyncStatus: cinemaMoviesStatus,
  refetch: refetchCinemaMovies,
} = useCustomQuery({
  key: ['cinema-showtime-movies', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) throw new Error('Identificador del cine no disponible.')
    return getCarteleraActivaCine(id)
  },
})

const cinemaMovies = computed<CinemaMovieResponseDTO[]>(() => {
  const data = cinemaMoviesState.value.data as CinemaMovieResponseDTO[] | undefined
  return data ?? []
})

const movieIds = computed(() => {
  const ids = new Set<string>()
  for (const item of cinemaMovies.value) {
    if (item.movieId) ids.add(item.movieId)
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
  key: ['cinema-showtime-movie-details', () => movieIdsKey.value],
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

const cinemaMovieOptions = computed<CinemaMovieOption[]>(() => {
  return cinemaMovies.value.map((item) => {
    const movie = moviesById.value.get(item.movieId) ?? null
    const duration = movie?.duration ? `${movie.duration} min` : 'Duración no disponible'
    const title = movie?.title ?? 'Película no disponible'
    return {
      ...item,
      movie,
      movieTitle: title,
      movieDuration: duration,
    }
  })
})

const cinemaMoviesLoading = computed(
  () => cinemaMoviesStatus.value === 'loading' || moviesStatus.value === 'loading',
)
const cinemaMoviePlaceholder = computed(() =>
  cinemaMoviesLoading.value
    ? 'Cargando películas…'
    : cinemaMovieOptions.value.length
    ? 'Selecciona una película'
    : 'No hay películas activas asociadas al cine',
)

const {
  state: hallsState,
  asyncStatus: hallsStatus,
  refetch: refetchHalls,
} = useCustomQuery({
  key: ['cinema-halls-for-showtime', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) throw new Error('Identificador del cine no disponible.')
    return getCinemaHallsByCinemaId(id)
  },
})

const hallOptions = computed<CinemaHallResponseDTO[]>(() => {
  const data = hallsState.value.data as CinemaHallResponseDTO[] | undefined
  return data ?? []
})

const hallsLoading = computed(() => hallsStatus.value === 'loading')
const hallPlaceholder = computed(() =>
  hallsLoading.value
    ? 'Cargando salas…'
    : hallOptions.value.length
    ? 'Selecciona una sala'
    : 'No hay salas registradas para el cine',
)

const selectedCinemaMovie = ref<CinemaMovieOption | null>(null)
const selectedHall = ref<CinemaHallResponseDTO | null>(null)
const startTime = ref<Date | null>(null)
const minDate = ref(new Date())

const errors = reactive({
  cinemaMovie: null as string | null,
  hall: null as string | null,
  startTime: null as string | null,
  endTime: null as string | null,
})

const submitting = ref(false)

const summaryFormatter = new Intl.DateTimeFormat('es-GT', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const movieDurationMinutes = computed(() => {
  const duration = selectedCinemaMovie.value?.movie?.duration
  return typeof duration === 'number' && duration > 0 ? duration : null
})

const computedEndTime = computed<Date | null>(() => {
  if (!startTime.value || !movieDurationMinutes.value) return null
  const end = new Date(startTime.value.getTime() + movieDurationMinutes.value * 60_000)
  return end
})

const formattedEndTime = computed(() => {
  const end = computedEndTime.value
  return end ? summaryFormatter.format(end) : ''
})

const formattedSummary = computed(() => {
  if (!startTime.value || !computedEndTime.value) return 'Horario no definido.'
  const start = summaryFormatter.format(startTime.value)
  const end = summaryFormatter.format(computedEndTime.value)
  return `${start} – ${end}`
})

function validate() {
  errors.cinemaMovie = selectedCinemaMovie.value ? null : 'Selecciona una película.'
  errors.hall = selectedHall.value ? null : 'Selecciona una sala.'
  errors.startTime = startTime.value ? null : 'Selecciona la fecha y hora de inicio.'
  if (!movieDurationMinutes.value) {
    errors.endTime = 'La película seleccionada no tiene una duración válida.'
  } else if (!startTime.value) {
    errors.endTime = 'Selecciona la fecha y hora de inicio.'
  } else {
    errors.endTime = null
  }

  return !errors.cinemaMovie && !errors.hall && !errors.startTime && !errors.endTime
}

function toIsoString(date: Date) {
  return new Date(date).toISOString()
}

async function onSubmit() {
  if (!validate()) return

  const id = cinemaId.value
  if (!id) {
    toast.error('No se pudo determinar el cine seleccionado.')
    return
  }

  if (!selectedCinemaMovie.value || !selectedHall.value || !startTime.value || !computedEndTime.value) {
    toast.error('Los datos de la función no están completos.')
    return
  }

  submitting.value = true

  try {
    await createShowtime({
      cinemaMovieId: selectedCinemaMovie.value.id,
      hallId: selectedHall.value.id,
      startTime: toIsoString(startTime.value),
      endTime: toIsoString(computedEndTime.value),
    })

    toast.success('Función creada correctamente.')
    await Promise.all([refetchCinemaMovies(), refetchMovies(), refetchHalls()])
    await router.push(`/admin/cines/funciones/cine-${id}`)
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? 'No se pudo registrar la función.'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}
</script>
