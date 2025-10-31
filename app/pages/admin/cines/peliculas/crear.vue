<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-3xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink :to="`/admin/cines/peliculas/cine-${cinemaId}`">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al listado de películas del cine" />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Asignar película al cine
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
              <label class="block text-sm font-medium text-slate-700 mb-1" for="movie">
                Película *
              </label>
              <AutoComplete
                id="movie"
                v-model="selectedMovie"
                :suggestions="movieSuggestions"
                optionLabel="title"
                class="w-full"
                dropdown
                forceSelection
                :loading="moviesLoading"
                placeholder="Busca por título"
                @complete="loadMovies"
              >
                <template #option="slotProps">
                  <div class="flex flex-col">
                    <span class="font-semibold text-slate-900">{{ slotProps.option.title }}</span>
                    <span class="text-xs text-slate-600">
                      {{ slotProps.option.duration ? `${slotProps.option.duration} min` : 'Duración no disponible' }}
                    </span>
                  </div>
                </template>
              </AutoComplete>
              <p v-if="errors.movie" class="mt-1 text-sm text-red-600">
                {{ errors.movie }}
              </p>
              <p class="mt-2 text-xs text-slate-500">
                Solo se muestran películas activas; este filtro no se puede modificar.
              </p>
            </div>

            <div
              v-if="selectedMovie"
              class="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1 text-sm text-slate-600"
            >
              <p>
                <span class="font-semibold text-slate-800">Título:</span>
                {{ selectedMovie.title }}
              </p>
              <p>
                <span class="font-semibold text-slate-800">Duración:</span>
                {{ selectedMovie.duration ? `${selectedMovie.duration} min` : '—' }}
              </p>
              <p>
                <span class="font-semibold text-slate-800">Clasificación:</span>
                {{ selectedMovie.classification?.name ?? '—' }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <RouterLink :to="`/admin/cines/peliculas/cine-${cinemaId}`">
              <Button type="button" label="Cancelar" severity="secondary" outlined />
            </RouterLink>
            <Button
              type="submit"
              label="Asignar película"
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
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import AutoComplete from 'primevue/autocomplete'
import { toast } from 'vue-sonner'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { createCinemaMovie } from '~/lib/api/cinema/cinema-movie'
import { searchMovies, type MovieResponseDTO } from '~/lib/api/movies/movie'
import { useCustomQuery } from '~/composables/useCustomQuery'

const route = useRoute()
const router = useRouter()

const cinemaId = computed(() => {
  const value = route.query.cineId
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? ''
  return ''
})

const { state: cinemaState } = useCustomQuery({
  key: ['cinema-for-movie-create', () => cinemaId.value],
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

const selectedMovie = ref<MovieResponseDTO | null>(null)
const movieSuggestions = ref<MovieResponseDTO[]>([])
const moviesLoading = ref(false)

const errors = reactive({
  movie: null as string | null,
})

const submitting = ref(false)

async function loadMovies(event: { query: string }) {
  moviesLoading.value = true
  try {
    const query = event.query?.trim() ?? ''
    const response = await searchMovies(
      {
        title: query.length ? query : null,
        active: true,
      },
      0,
    )
    movieSuggestions.value = response.content ?? []
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? 'No se pudieron cargar las películas activas.'
    toast.error(message)
  } finally {
    moviesLoading.value = false
  }
}

function validate() {
  errors.movie = selectedMovie.value ? null : 'Selecciona una película activa.'
  return !errors.movie
}

async function onSubmit() {
  if (!validate()) return
  const id = cinemaId.value
  if (!id) {
    toast.error('No se pudo determinar el cine seleccionado.')
    return
  }
  if (!selectedMovie.value) {
    toast.error('Debes seleccionar una película.')
    return
  }

  submitting.value = true

  try {
    await createCinemaMovie({
      cinemaId: id,
      movieId: selectedMovie.value.id,
    })
    toast.success('Película asignada correctamente.')
    await router.push(`/admin/cines/peliculas/cine-${id}`)
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? 'No se pudo asignar la película al cine.'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadMovies({ query: '' })
})
</script>
