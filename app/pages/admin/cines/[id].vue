<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-4xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/cines">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al listado de cines" />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Detalle del cine
          </h1>
        </div>
        <div v-if="cinema" class="flex items-center gap-2">
          <RouterLink :to="`/admin/cines/editar-${cinema.id}`">
            <Button icon="pi pi-pencil" label="Editar" rounded />
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto" role="main">
      <div v-if="state.status === 'pending'" class="py-16 text-center text-slate-600">
        Cargando cine…
      </div>

      <div v-else-if="state.status === 'error'" class="py-16 text-center text-red-600">
        Ocurrió un error al cargar la información del cine.
      </div>

      <div v-else-if="!cinema" class="py-16 text-center text-slate-600">
        No se encontró el cine solicitado.
      </div>

      <div v-else class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8 space-y-6">
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Identificador
            </p>
            <p class="mt-1 font-mono text-sm break-all">{{ cinema.id }}</p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Nombre
            </p>
            <p class="mt-1 text-base font-semibold text-slate-900">
              {{ cinema.name }}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Compañía
            </p>
            <p class="mt-1 text-base text-slate-800">
              <RouterLink v-if="cinema.company?.id" :to="`/admin/companias/${cinema.company.id}`" class="text-primary-600 hover:underline">
                {{ cinema.company?.name ?? '—' }}
              </RouterLink>
              <span v-else>{{ cinema.company?.name ?? '—' }}</span>
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Costo por día
            </p>
            <p class="mt-1 text-base text-slate-800">
              {{ formatCurrency(cinema.costPerDay) }}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Creado el
            </p>
            <p class="mt-1 text-base text-slate-800">
              {{ formatDate(cinema.createdAt) }}
            </p>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'

const route = useRoute()

const { state } = useCustomQuery({
  key: ['cinema-detail', () => route.params.id as string],
  query: () => getCinemaById(route.params.id as string),
})

const cinema = computed<CinemaResponseDTO | null>(() => {
  const data = state.value?.data as CinemaResponseDTO | undefined
  return data ?? null
})

function formatCurrency(value?: number) {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(value?: string) {
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
