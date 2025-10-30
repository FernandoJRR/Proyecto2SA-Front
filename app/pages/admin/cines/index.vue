<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-7xl mx-auto mb-6" role="banner">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver a Administración" />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Cines
          </h1>
        </div>
        <RouterLink to="/admin/cines/crear">
          <Button icon="pi pi-plus" label="Nuevo cine" rounded raised aria-label="Registrar nuevo cine" />
        </RouterLink>
      </div>
    </header>

    <main class="max-w-7xl mx-auto" role="main">
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <DataTable
          :value="cinemas"
          dataKey="id"
          tableStyle="min-width: 60rem"
          stripedRows
          rowHover
          :loading="status === 'loading'"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm text-slate-600">
                Total:
                <span class="font-semibold">{{ cinemas.length }}</span>
              </span>
              <Button
                icon="pi pi-refresh"
                label="Recargar"
                size="small"
                severity="secondary"
                text
                :loading="status === 'loading'"
                @click="() => refetch()"
              />
            </div>
          </template>

          <Column field="name" header="Nombre" sortable />
          <Column header="Compañía">
            <template #body="{ data }">
              <span class="block max-w-xs truncate" :title="data.company?.name">
                {{ data.company?.name ?? '—' }}
              </span>
            </template>
          </Column>
          <Column field="costPerDay" header="Costo por día">
            <template #body="{ data }">
              {{ formatCurrency(data.costPerDay) }}
            </template>
          </Column>
          <Column field="createdAt" header="Creado">
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>
          <Column header="Acciones" headerStyle="width:14rem">
            <template #body="{ data }">
              <div class="flex flex-wrap items-center gap-1">
                <RouterLink :to="`/admin/cines/${data.id}`">
                  <Button label="Ver" severity="info" variant="text" rounded aria-label="Ver cine" />
                </RouterLink>
                <RouterLink :to="`/admin/cines/editar-${data.id}`">
                  <Button label="Editar" severity="warn" variant="text" rounded aria-label="Editar cine" />
                </RouterLink>
                <RouterLink :to="`/admin/cines/sala/cine/${data.id}`">
                  <Button label="Salas" severity="primary" variant="text" rounded aria-label="Administrar salas" />
                </RouterLink>
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="py-10 text-center text-slate-600">
              <i class="pi pi-inbox text-3xl mb-2 text-slate-400" aria-hidden="true"></i>
              <div>No hay cines registrados.</div>
            </div>
          </template>

          <template #loading>
            <div class="py-10 text-center text-slate-600">
              Cargando cines…
            </div>
          </template>

          <template #footer>
            Hay en total {{ cinemas.length }} cines.
          </template>
        </DataTable>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import { getAllCinemas, getCinemasByCompanyId, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { useAuthStore } from '~/stores/auth'

const { companyId } = storeToRefs(useAuthStore())

const { state, asyncStatus: status, refetch } = useCustomQuery({
  key: ['cinemas-index', companyId],
  query: () => {
    const id = companyId.value?.trim()
    return id ? getCinemasByCompanyId(id) : getAllCinemas()
  },
})

const cinemas = computed<CinemaResponseDTO[]>(() => state.value.data ?? [])

watch(companyId, () => {
  refetch()
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
