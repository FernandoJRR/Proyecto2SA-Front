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
              Películas del cine
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
          <RouterLink :to="`/admin/cines/peliculas/crear?cineId=${cinemaId}`">
            <Button icon="pi pi-plus" label="Asignar película" rounded raised aria-label="Asignar película al cine" />
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto" role="main">
      <div class="rounded-xl border border-slate-200 bg-white">
        <DataTable
          :value="rows"
          dataKey="id"
          tableStyle="min-width: 60rem"
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
              Cargando películas…
            </div>
          </template>

          <Column header="Película">
            <template #body="{ data }">
              <div class="flex items-start gap-3">
                <div class="flex-1">
                  <p class="font-semibold text-slate-900">
                    {{ data.movie?.title ?? 'Película no disponible' }}
                  </p>
                  <p class="text-sm text-slate-600">
                    Duración: {{ data.movie?.duration ? `${data.movie.duration} min` : '—' }}
                  </p>
                </div>
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

          <Column header="Categorías">
            <template #body="{ data }">
              <div class="flex flex-wrap gap-1">
                <Tag
                  v-for="category in data.movie?.categories ?? []"
                  :key="category.id"
                  :value="category.name"
                  rounded
                  severity="secondary"
                />
                <span v-if="!data.movie?.categories?.length">—</span>
              </div>
            </template>
          </Column>

          <Column header="Estado">
            <template #body="{ data }">
              <Tag
                :value="data.active ? 'Activo' : 'Inactivo'"
                :severity="data.active ? 'success' : 'danger'"
                rounded
              />
            </template>
          </Column>

          <Column header="Acciones" headerStyle="width:14rem">
            <template #body="{ data }">
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  icon="pi pi-power-off"
                  :label="data.active ? 'Desactivar' : 'Activar'"
                  size="small"
                  text
                  severity="warn"
                  :loading="actionLoading === data.id"
                  @click="() => handleToggleStatus(data.id)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { toast } from 'vue-sonner'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import {
  getTodasCartelerasCine,
  toogleCinemaMovieStatus,
  type CinemaMovieResponseDTO,
} from '~/lib/api/cinema/cinema-movie'
import { getMoviesByIds, type MovieResponseDTO } from '~/lib/api/movies/movie'
import { useCustomQuery } from '~/composables/useCustomQuery'

type CinemaMovieWithDetails = CinemaMovieResponseDTO & { movie: MovieResponseDTO | null }

const route = useRoute()
const cinemaId = computed(() => String(route.params.id ?? ''))

const { state: cinemaState } = useCustomQuery({
  key: ['cinema-for-movies', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) throw new Error('Identificador del cine no disponible.')
    return getCinemaById(id)
  },
})

const {
  state: cinemaMoviesState,
  asyncStatus: cinemaMoviesStatus,
  refetch: refetchCinemaMovies,
} = useCustomQuery({
  key: ['cinema-movies', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) throw new Error('Identificador del cine no disponible.')
    return getTodasCartelerasCine(id)
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
  key: ['movies-for-cinema', () => movieIdsKey.value],
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

const rows = computed<CinemaMovieWithDetails[]>(() => {
  return cinemaMovies.value.map((item) => ({
    ...item,
    movie: moviesById.value.get(item.movieId) ?? null,
  }))
})

const loading = computed(() => cinemaMoviesStatus.value === 'loading' || moviesStatus.value === 'loading')

const cinemaTitle = computed(() => {
  const stateValue = cinemaState.value
  if (stateValue.status === 'pending') return 'Cargando información del cine…'
  if (stateValue.status === 'error') return 'No fue posible cargar la información del cine.'
  const data = stateValue.data as CinemaResponseDTO | undefined
  return data ? `Gestionar películas de ${data.name}` : 'Cine no encontrado.'
})

const cinemaMoviesStateStatus = computed(() => cinemaMoviesState.value.status)
const emptyMessage = computed(() =>
  cinemaMoviesStateStatus.value === 'error'
    ? 'No fue posible cargar las películas asociadas. Intenta recargar.'
    : 'Este cine aún no tiene películas asociadas.'
)

const actionLoading = ref<string | null>(null)

async function handleToggleStatus(id: string) {
  try {
    actionLoading.value = id
    await toogleCinemaMovieStatus(id)
    toast.success('Se actualizó el estado de la película en el cine.')
    await refetchCinemaMovies()
    await refetchMovies()
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? 'No se pudo actualizar el estado de la película.'
    toast.error(message)
  } finally {
    actionLoading.value = null
  }
}

async function handleRefresh() {
  await Promise.all([refetchCinemaMovies(), refetchMovies()])
}
</script>
