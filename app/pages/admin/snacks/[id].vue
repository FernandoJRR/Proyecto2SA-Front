<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-4xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/snacks">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver a listado" />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Detalle del snack
          </h1>
        </div>
        <RouterLink v-if="snack" :to="`/admin/snacks/editar-${snack.id}`">
          <Button icon="pi pi-pencil" label="Editar" rounded aria-label="Editar snack" />
        </RouterLink>
      </div>
    </header>

    <main class="max-w-4xl mx-auto" role="main">
      <div v-if="state.status === 'pending'" class="py-16 text-center text-slate-600">
        Cargando snack…
      </div>

      <div v-else-if="state.status === 'error'" class="py-16 text-center text-red-600">
        No fue posible cargar la información del snack.
      </div>

      <div v-else-if="!snack" class="py-16 text-center text-slate-600">
        No se encontró el snack solicitado.
      </div>

      <div v-else-if="!isAllowed" class="py-16 text-center text-amber-600">
        No tienes permiso para ver este snack.
      </div>

      <div
        v-else
        class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8 space-y-6"
      >
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="sm:col-span-2 flex flex-col sm:flex-row gap-4">
            <div class="w-36 h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                v-if="snack.imageUrl"
                :src="snack.imageUrl"
                :alt="snack.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                Sin imagen
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
                Nombre
              </p>
              <p class="mt-1 text-lg font-semibold text-slate-900">
                {{ snack.name }}
              </p>
              <p class="mt-4 text-sm font-medium text-slate-600 uppercase tracking-wide">
                Precio
              </p>
              <p class="mt-1 text-base text-slate-800">
                {{ formatCurrency(snack.price) }}
              </p>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Cine
            </p>
            <p class="mt-1 text-base text-slate-800">
              {{ resolveCinemaName(snack.cinemaId) }}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Estado
            </p>
            <p class="mt-1">
              <Tag :value="snack.active ? 'Activo' : 'Inactivo'" :severity="snack.active ? 'success' : 'secondary'" rounded />
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Creado
            </p>
            <p class="mt-1 text-base text-slate-800">
              {{ formatDate(snack.createdAt) }}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Actualizado
            </p>
            <p class="mt-1 text-base text-slate-800">
              {{ formatDate(snack.updatedAt) }}
            </p>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { getSnackById, type SnackResponseDTO } from '~/lib/api/ventas/snacks'
import { getAllCinemas, getCinemasByCompanyId, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { useAuthStore } from '~/stores/auth'
import { useCustomQuery } from '~/composables/useCustomQuery'

const route = useRoute()
const snackId = route.params.id as string

const authStore = useAuthStore()
const { companyId } = storeToRefs(authStore)

const {
  state,
} = useCustomQuery({
  key: ['snack-detail', snackId],
  query: () => getSnackById(snackId),
})

const {
  state: cinemasState,
  refetch: refetchCinemas,
} = useCustomQuery({
  key: ['snacks-detail-cinemas', companyId.value ?? null],
  query: () => {
    const id = companyId.value?.trim()
    return id ? getCinemasByCompanyId(id) : getAllCinemas()
  },
})

const snack = computed<SnackResponseDTO | null>(() => {
  const data = state.value.data as SnackResponseDTO | undefined
  return data ?? null
})

const cinemaOptions = computed<CinemaResponseDTO[]>(() => (cinemasState.value.data ?? []) as CinemaResponseDTO[])
const cinemaNameMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  cinemaOptions.value.forEach((cinema) => {
    map[cinema.id] = cinema.name
  })
  return map
})

const isAllowed = computed(() => {
  if (!companyId.value) return true
  const allowedIds = cinemaOptions.value.map((c) => c.id)
  if (!snack.value) return false
  return allowedIds.includes(snack.value.cinemaId)
})

watch(companyId, () => {
  refetchCinemas()
})

function resolveCinemaName(id?: string | null) {
  if (!id) return '—'
  return cinemaNameMap.value[id] ?? id
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number') return '—'
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
