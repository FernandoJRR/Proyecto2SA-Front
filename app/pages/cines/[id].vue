<template>
  <PublicCinemaTemplate>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <NuxtLink
          to="/cines"
          class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <i class="pi pi-arrow-left text-xs" aria-hidden="true"></i>
          Volver al listado de cines
        </NuxtLink>
        <div class="text-right">
          <p class="text-sm text-slate-500">Catálogo público</p>
          <p class="text-xs text-slate-400">
            Visualiza la información del cine y los snacks disponibles.
          </p>
        </div>
      </div>
    </template>

    <template v-if="showTopAds || adsLoading" #top-ads>
      <div v-if="showTopAds" class="space-y-4">
        <div
          v-if="textBannerAd"
          class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <AdRenderer :ad="textBannerAd" />
        </div>

        <div
          v-if="horizontalAd"
          class="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden"
        >
          <AdRenderer :ad="horizontalAd" />
        </div>
      </div>
      <div
        v-else
        class="h-32 rounded-2xl border border-dashed border-slate-300 bg-white/60 animate-pulse"
      ></div>
    </template>

    <template v-if="showVerticalAd" #left-ads>
      <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <AdRenderer :ad="verticalAd" />
      </div>
    </template>

    <template v-if="showVerticalAd" #right-ads>
      <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <AdRenderer :ad="verticalAd" />
      </div>
    </template>

    <template #default>
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="bg-slate-900 text-white px-6 py-8 sm:px-8">
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span v-if="cinema">{{ cinema.name }}</span>
            <span v-else-if="cinemaStatus === 'loading'">Cargando cine…</span>
            <span v-else>Cine no disponible</span>
          </h1>
          <p class="mt-2 text-sm text-slate-200">
            Información general del cine y datos de contacto.
          </p>
        </div>

        <div v-if="cinemaStatus === 'loading' && !cinema" class="p-8 text-center text-slate-600">
          <i class="pi pi-spinner pi-spin text-2xl mb-3" aria-hidden="true"></i>
          Cargando información del cine…
        </div>

        <div v-else-if="cinemaStatus === 'error'" class="p-8 text-center text-red-600 space-y-3">
          <p>{{ cinemaErrorMessage }}</p>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-700 hover:bg-red-50"
            @click="refetchCinema"
          >
            <i class="pi pi-refresh text-xs" aria-hidden="true"></i>
            Reintentar
          </button>
        </div>

        <div v-else-if="!cinema" class="p-8 text-center text-slate-600">
          No se encontró el cine solicitado.
        </div>

        <div v-else class="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-700">
          <div class="space-y-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900 uppercase tracking-wide">
                Información del cine
              </h2>
              <p class="mt-1 text-slate-600">
                Este cine pertenece a la empresa
                <span class="font-semibold text-slate-900">{{ cinema.company.name }}</span>.
              </p>
            </div>
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-600">Registrado desde</span>
              <span class="font-semibold text-slate-900">{{ formatDate(cinema.createdAt) }}</span>
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-base font-semibold text-slate-900 uppercase tracking-wide">
              Datos de contacto
            </h2>
            <div class="flex items-start justify-between gap-4">
              <span class="font-medium text-slate-600">Dirección</span>
              <span class="text-right text-slate-800">{{ cinema.company.address }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-600">Teléfono</span>
              <span class="font-semibold text-slate-900">{{ cinema.company.phoneNumber }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="showVerticalAd" class="xl:hidden">
        <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="position in 2"
            :key="`vertical-mobile-${position}`"
            class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <AdRenderer :ad="verticalAd" />
          </div>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Funciones disponibles</h2>
            <p class="text-sm text-slate-600">
              Consulta los próximos horarios y películas programadas en este cine.
            </p>
          </div>
          <span v-if="showtimesStatus === 'success'" class="text-sm text-slate-600">
            {{ totalShowtimes }}
            {{ totalShowtimes === 1 ? "función programada" : "funciones programadas" }}
          </span>
        </div>

        <div v-if="showtimesStatus === 'loading' && !showtimes.length" class="py-16 text-center text-slate-600">
          <i class="pi pi-spinner pi-spin text-2xl mb-3" aria-hidden="true"></i>
          Cargando funciones…
        </div>

        <div v-else-if="showtimesStatus === 'error'" class="py-16 text-center text-red-600 space-y-3">
          <p>{{ showtimesErrorMessage }}</p>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-700 hover:bg-red-50"
            @click="refetchShowtimes"
          >
            <i class="pi pi-refresh text-xs" aria-hidden="true"></i>
            Reintentar
          </button>
        </div>

        <div v-else-if="!showtimes.length" class="py-16 text-center text-slate-600">
          Aún no hay funciones activas para este cine.
        </div>

        <div v-else class="-mx-1 overflow-hidden px-1">
          <div class="flex gap-5 overflow-x-auto pb-4">
            <PublicShowtimeCard
              v-for="showtime in showtimes"
              :key="showtime.id"
              :showtime="showtime"
            />
          </div>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Snacks disponibles</h2>
            <p class="text-sm text-slate-600">
              Este catálogo es solo informativo; las compras se realizan en taquilla.
            </p>
          </div>
          <span v-if="snacksStatus === 'success' && totalSnacks !== null" class="text-sm text-slate-600">
            {{ totalSnacks }}
            {{ totalSnacks === 1 ? "opción disponible" : "opciones disponibles" }}
          </span>
        </div>

        <div v-if="snacksStatus === 'loading' && !snacks.length" class="py-16 text-center text-slate-600">
          <i class="pi pi-spinner pi-spin text-2xl mb-3" aria-hidden="true"></i>
          Cargando catálogo de snacks…
        </div>

        <div v-else-if="snacksStatus === 'error'" class="py-16 text-center text-red-600 space-y-3">
          <p>{{ snacksErrorMessage }}</p>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-700 hover:bg-red-50"
            @click="refetchSnacks"
          >
            <i class="pi pi-refresh text-xs" aria-hidden="true"></i>
            Reintentar
          </button>
        </div>

        <div v-else-if="!snacks.length" class="py-16 text-center text-slate-600">
          Por ahora este cine no tiene snacks disponibles.
        </div>

        <div v-else class="-mx-1 overflow-hidden px-1">
          <div class="flex gap-5 overflow-x-auto pb-4">
            <article
              v-for="snack in snacks"
              :key="snack.id"
              class="w-72 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div class="flex h-40 items-center justify-center overflow-hidden bg-slate-100">
                <img
                  v-if="snack.imageUrl"
                  :src="snack.imageUrl"
                  :alt="snack.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-slate-400 text-sm">
                  Sin imagen
                </div>
              </div>
              <div class="flex h-full flex-col gap-3 p-5">
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">
                    {{ snack.name }}
                  </h3>
                  <p class="text-sm text-slate-500">
                    Disponible en este cine.
                  </p>
                </div>
                <div class="mt-auto">
                  <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
                    Precio sugerido
                  </p>
                  <p class="text-lg font-semibold text-primary-600">
                    {{ formatCurrency(snack.price) }}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </template>
  </PublicCinemaTemplate>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdRenderer from '~/components/AdRenderer.vue'
import PublicCinemaTemplate from '~/components/PublicCinemaTemplate.vue'
import PublicShowtimeCard from '~/components/PublicShowtimeCard.vue'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { searchSnacksByCinema, type SnackView } from '~/lib/api/ventas/snacks'
import {
  AddType,
  getAnuncioAleatorioByCinemaAndType,
  type AnuncioViewResponseDTO,
} from '~/lib/api/anuncios/anuncio'
import { getShowtimesByCinema, type ShowtimeResponseDTO } from '~/lib/api/cinema/showtime'
import { useCustomQuery } from '~/composables/useCustomQuery'

const route = useRoute()

const cinemaId = computed(() => {
  const value = route.params.id
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? ''
  return ''
})

const {
  state: cinemaState,
  asyncStatus: cinemaAsyncStatus,
  refetch: refetchCinema,
} = useCustomQuery({
  key: ['public-cinema-detail', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) {
      throw new Error('Identificador de cine no disponible.')
    }
    return getCinemaById(id)
  },
})

const cinemaStatus = computed(() => cinemaAsyncStatus?.value ?? 'loading')
const cinema = computed<CinemaResponseDTO | null>(() => {
  const data = cinemaState.value?.data as CinemaResponseDTO | undefined
  return data ?? null
})
const cinemaErrorMessage = computed(() => {
  const error = cinemaState.value?.error as { message?: string } | undefined
  return error?.message ?? 'No se pudo cargar la información del cine.'
})

const {
  state: snacksState,
  asyncStatus: snacksAsyncStatus,
  refetch: refetchSnacks,
} = useCustomQuery({
  key: ['public-cinema-snacks', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) {
      throw new Error('Identificador de cine no disponible.')
    }
    return searchSnacksByCinema(id, 0, { active: true })
  },
})

const snacksStatus = computed(() => snacksAsyncStatus?.value ?? 'loading')
const snacks = computed<SnackView[]>(() => snacksState.value?.data?.content ?? [])
const snacksErrorMessage = computed(() => {
  const error = snacksState.value?.error as { message?: string } | undefined
  return error?.message ?? 'No se pudo cargar el catálogo de snacks.'
})
const totalSnacks = computed(() => snacksState.value?.data?.totalElements ?? snacks.value.length ?? 0)

const {
  state: showtimesState,
  asyncStatus: showtimesAsyncStatus,
  refetch: refetchShowtimes,
} = useCustomQuery({
  key: ['public-cinema-showtimes', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) {
      throw new Error('Identificador de cine no disponible.')
    }
    return getShowtimesByCinema(id)
  },
})

const showtimesStatus = computed(() => showtimesAsyncStatus?.value ?? 'loading')
const showtimes = computed<ShowtimeResponseDTO[]>(() => {
  const data = showtimesState.value?.data as ShowtimeResponseDTO[] | undefined
  return data ?? []
})
const showtimesErrorMessage = computed(() => {
  const error = showtimesState.value?.error as { message?: string } | undefined
  return error?.message ?? 'No se pudieron cargar las funciones.'
})
const totalShowtimes = computed(() => showtimes.value.length)

const adsLoading = ref(false)
const textBannerAd = ref<AnuncioViewResponseDTO | null>(null)
const horizontalAd = ref<AnuncioViewResponseDTO | null>(null)
const verticalAd = ref<AnuncioViewResponseDTO | null>(null)

const showTopAds = computed(() => !!textBannerAd.value || !!horizontalAd.value)
const showVerticalAd = computed(() => verticalAd.value !== null)
async function loadAds(id: string) {
  if (!id) {
    textBannerAd.value = null
    horizontalAd.value = null
    verticalAd.value = null
    return
  }

  adsLoading.value = true
  try {
    const [textBanner, horizontal, vertical] = await Promise.all([
      getAnuncioAleatorioByCinemaAndType(id, AddType.TEXT_BANNER),
      getAnuncioAleatorioByCinemaAndType(id, AddType.MEDIA_HORIZONTAL),
      getAnuncioAleatorioByCinemaAndType(id, AddType.MEDIA_VERTICAL),
    ])

    textBannerAd.value = textBanner ?? null
    horizontalAd.value = horizontal ?? null
    verticalAd.value = vertical ?? null
  } catch (error) {
    console.error('Error al cargar anuncios', error)
    textBannerAd.value = null
    horizontalAd.value = null
    verticalAd.value = null
  } finally {
    adsLoading.value = false
  }
}

watch(
  () => cinemaId.value,
  (id) => {
    if (!id) {
      textBannerAd.value = null
      horizontalAd.value = null
      verticalAd.value = null
      return
    }

    loadAds(id).catch((error) => {
      console.error('Error inesperado al cargar anuncios', error)
    })
  },
  { immediate: true }
)

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}
</script>
