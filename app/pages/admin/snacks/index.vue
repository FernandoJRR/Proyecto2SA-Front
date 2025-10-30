<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-7xl mx-auto mb-6" role="banner">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver a Administración" />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">Snacks</h1>
        </div>
        <RouterLink to="/admin/snacks/crear">
          <Button icon="pi pi-plus" label="Nuevo snack" rounded raised aria-label="Crear snack" />
        </RouterLink>
      </div>
    </header>

    <main class="max-w-7xl mx-auto" role="main">
      <section class="rounded-xl border border-slate-200 bg-white p-4 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-3">Filtros</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InputText
            v-model.trim="filters.name"
            placeholder="Buscar por nombre"
            class="w-full"
            @keydown.enter="() => runSearch(0)"
          />
          <Dropdown
            v-model="filters.active"
            :options="activeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Estado"
            class="w-full"
            @change="() => runSearch(0)"
          />
          <Dropdown
            v-model="filters.cinemaId"
            :options="cinemaFilterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Cine"
            class="w-full"
            :showClear="!companyId"
            :loading="cinemasLoading"
            :disabled="cinemasLoading || !cinemaFilterOptions.length"
            filter
            @change="() => runSearch(0)"
          />
          <div class="flex items-center justify-end gap-2">
            <Button icon="pi pi-search" label="Buscar" :loading="loading" @click="() => runSearch(0)" />
            <Button icon="pi pi-filter-slash" label="Limpiar" severity="secondary" outlined @click="resetFilters" />
          </div>
        </div>
      </section>

      <div class="rounded-xl border border-slate-200 bg-white shadow">
        <DataTable
          :value="rows"
          dataKey="id"
          :loading="loading"
          :lazy="true"
          :paginator="true"
          :rows="PAGE_SIZE"
          :totalRecords="totalRecords"
          @page="onPageChange"
          tableStyle="min-width: 64rem"
          class="rounded-xl"
          :pt="{ header: { class: 'text-slate-700' } }"
        >
          <template #empty>
            <div class="py-12 text-center text-slate-600">
              <i class="pi pi-inbox text-3xl mb-3 text-slate-400" aria-hidden="true"></i>
              <p>No se encontraron snacks.</p>
            </div>
          </template>

          <Column header="" style="width: 6rem">
            <template #body="{ data }">
              <div class="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  v-if="data.imageUrl"
                  :src="data.imageUrl"
                  :alt="data.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Sin imagen
                </div>
              </div>
            </template>
          </Column>

          <Column field="name" header="Nombre" style="min-width: 14rem" />
          <Column field="price" header="Precio" style="width: 8rem">
            <template #body="{ data }">
              {{ formatCurrency(data.price) }}
            </template>
          </Column>
          <Column field="cinemaId" header="Cine" style="min-width: 12rem">
            <template #body="{ data }">
              {{ resolveCinemaName(data.cinemaId) }}
            </template>
          </Column>
          <Column field="active" header="Activo" style="width: 6rem">
            <template #body="{ data }">
              <Tag
                :value="data.active ? 'Sí' : 'No'"
                :severity="data.active ? 'success' : 'secondary'"
                rounded
              />
            </template>
          </Column>
          <Column field="createdAt" header="Creado" style="min-width: 10rem">
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>
          <Column header="Acciones" headerStyle="width:12rem">
            <template #body="{ data }">
              <div class="flex flex-wrap items-center gap-2">
                <RouterLink :to="`/admin/snacks/${data.id}`">
                  <Button icon="pi pi-eye" label="Ver" size="small" text />
                </RouterLink>
                <RouterLink :to="`/admin/snacks/editar-${data.id}`">
                  <Button icon="pi pi-pencil" label="Editar" size="small" text severity="warning" />
                </RouterLink>
                <Button
                  icon="pi pi-refresh"
                  label="Cambiar estado"
                  size="small"
                  text
                  severity="danger"
                  @click="async () => {
                    try {
                      await updateSnackState(data.id);
                      toast.success('Estado del snack actualizado');
                      runSearch(page);
                    } catch (error: any) {
                      toast.error(error?.message ?? 'No fue posible actualizar el estado del snack');
                    }
                  }"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import { toast } from 'vue-sonner'
import { searchSnacks, searchSnacksByCinema, updateSnackState, type SnackView } from '~/lib/api/ventas/snacks'
import { getAllCinemas, getCinemasByCompanyId, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { useAuthStore } from '~/stores/auth'
import { useCustomQuery } from '~/composables/useCustomQuery'

const PAGE_SIZE = 20

const authStore = useAuthStore()
const { companyId } = storeToRefs(authStore)

const filters = reactive({
  name: '',
  active: null as boolean | null,
  cinemaId: null as string | null,
})

const loading = ref(false)
const rows = ref<SnackView[]>([])
const totalRecords = ref(0)
const page = ref(0)

const activeOptions = [
  { label: '—', value: null },
  { label: 'Activos', value: true },
  { label: 'Inactivos', value: false },
]

const companyKey = computed(() => companyId.value ?? null)

const {
  state: cinemasState,
  asyncStatus: cinemasStatus,
  refetch: refetchCinemas,
} = useCustomQuery({
  key: ['snacks-cinemas', companyKey.value],
  query: () => {
    const id = companyId.value?.trim()
    return id ? getCinemasByCompanyId(id) : getAllCinemas()
  },
})

const cinemaOptions = computed<Array<{ label: string; value: string }>>(() =>
  ((cinemasState.value.data ?? []) as CinemaResponseDTO[]).map((cinema) => ({
    label: cinema.name,
    value: cinema.id,
  }))
)

const cinemaFilterOptions = computed(() => {
  if (companyId.value) {
    return cinemaOptions.value
  }
  return [{ label: '— Todos los cines —', value: null }, ...cinemaOptions.value]
})

const cinemasLoading = computed(() => cinemasStatus.value === 'loading')

watch(
  cinemaOptions,
  (options) => {
    if (!companyId.value) return
    if (!options.length) {
      filters.cinemaId = null
      runSearch(0)
      return
    }
    if (!filters.cinemaId || !options.some((opt) => opt.value === filters.cinemaId)) {
      filters.cinemaId = options[0].value
      runSearch(0)
    }
  },
  { immediate: true }
)

async function runSearch(p: number = 0) {
  loading.value = true
  try {
    const name = filters.name ? filters.name.trim() : null
    const active = typeof filters.active === 'boolean' ? filters.active : null
    const cinemaSelected = filters.cinemaId?.trim() || null
    let response

    if (companyId.value) {
      const cinemaId = cinemaSelected ?? cinemaOptions.value[0]?.value ?? null
      if (!cinemaId) {
        rows.value = []
        totalRecords.value = 0
        page.value = 0
        return
      }
      response = await searchSnacksByCinema(cinemaId, p, { name, active })
    } else if (cinemaSelected) {
      response = await searchSnacksByCinema(cinemaSelected, p, { name, active })
    } else {
      response = await searchSnacks(p, { name, active })
    }

    rows.value = response.content
    totalRecords.value = response.totalElements
    page.value = response.number
  } catch (error: any) {
    toast.error(error?.message ?? 'No fue posible cargar los snacks')
    rows.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

function onPageChange(event: any) {
  if (event?.page !== undefined && event.page !== page.value) {
    runSearch(event.page)
  }
}

function resetFilters() {
  filters.name = ''
  filters.active = null
  filters.cinemaId = companyId.value ? (cinemaOptions.value[0]?.value ?? null) : null
  runSearch(0)
}

const cinemaNameMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  cinemaOptions.value.forEach((option) => {
    map[option.value] = option.label
  })
  return map
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

onMounted(() => {
  runSearch(0)
})

watch(companyId, () => {
  refetchCinemas()
  filters.cinemaId = companyId.value ? (cinemaOptions.value[0]?.value ?? null) : null
  runSearch(0)
})
</script>
