<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-10 bg-slate-50">
    <header class="max-w-6xl mx-auto mb-8" role="banner">
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
    </header>

    <main class="max-w-6xl mx-auto space-y-10" role="main">
      <section
        class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
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
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-600">Costo por día</span>
              <span class="font-semibold text-slate-900">{{ formatCurrency(cinema.costPerDay) }}</span>
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

        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <article
            v-for="snack in snacks"
            :key="snack.id"
            class="h-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
          >
            <div class="bg-slate-100 h-48 overflow-hidden flex items-center justify-center">
              <img
                v-if="snack.imageUrl"
                :src="snack.imageUrl"
                :alt="snack.name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                Sin imagen
              </div>
            </div>
            <div class="p-5 space-y-3 flex-1 flex flex-col">
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
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { searchSnacksByCinema, type SnackView } from '~/lib/api/ventas/snacks'
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
