<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
    <main class="max-w-7xl mx-auto">
      <!-- Header -->
      <header
        class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1
            class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
          >
            Mis anuncios
          </h1>
          <p class="text-slate-600">
            Visualiza y gestiona tus anuncios. La lista es paginada desde el
            servidor.
          </p>
        </div>
        <NuxtLink
          to="/anuncios/crear"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition"
        >
          <i class="pi pi-plus mr-2"></i>
          Crear anuncio
        </NuxtLink>
      </header>

      <!-- Filtros -->
      <section class="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="text-lg font-semibold text-slate-800 mb-3">Filtros</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Dropdown
            v-model="filters.type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tipo"
            class="w-full"
          />
          <Dropdown
            v-model="filters.paymentState"
            :options="stateOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Estado de pago"
            class="w-full"
          />
          <Dropdown
            v-model="filters.active"
            :options="activeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Activo"
            class="w-full"
          />
          <div class="flex items-center justify-end gap-2 lg:col-span-3">
            <Button
              icon="pi pi-search"
              label="Buscar"
              @click="() => runSearch(0)"
              :loading="loading"
            />
            <Button
              icon="pi pi-filter-slash"
              label="Limpiar"
              severity="secondary"
              outlined
              @click="resetFilters"
            />
          </div>
        </div>
      </section>

      <!-- Tabla -->
      <div class="rounded-xl border border-slate-200 bg-white">
        <DataTable
          :value="rows"
          dataKey="id"
          :loading="loading"
          :lazy="true"
          paginator
          :rows="PAGE_SIZE"
          :totalRecords="totalElements"
          @page="onPageChange"
          tableStyle="min-width: 64rem"
          class="rounded-xl"
          :pt="{ header: { class: 'text-slate-700' } }"
        >
          <template #empty>
            <div class="text-slate-600 py-8 text-center">No hay anuncios.</div>
          </template>

          <Column field="type" header="Tipo">
            <template #body="{ data }">
              <span
                class="uppercase text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-700"
              >
                {{ data.type }}
              </span>
            </template>
          </Column>

          <Column field="description" header="Descripción" />
          <Column field="contentType" header="Contenido" />
          <Column field="price" header="Precio">
            <template #body="{ data }">
              {{ formatMoney(data.price) }}
            </template>
          </Column>
          <Column field="paymentState" header="Pago">
            <template #body="{ data }">
              <span
                class="text-xs font-medium px-2 py-1 rounded"
                :class="{
                  'bg-yellow-100 text-yellow-700':
                    data.paymentState === 'PENDING',
                  'bg-green-100 text-green-700':
                    data.paymentState === 'COMPLETED',
                  'bg-red-100 text-red-700': data.paymentState === 'FAILED',
                }"
              >
                {{ data.paymentState }}
              </span>
            </template>
          </Column>
          <Column field="active" header="Activo">
            <template #body="{ data }">
              <span
                class="text-xs font-medium px-2 py-1 rounded"
                :class="
                  data.active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                "
              >
                {{ data.active ? "Sí" : "No" }}
              </span>
            </template>
          </Column>
          <Column field="addExpiration" header="Expira">
            <template #body="{ data }">
              {{ formatDate(data.addExpiration) }}
            </template>
          </Column>
          <Column field="createdAt" header="Creado">
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>

          <Column header="Acciones" headerStyle="width:20rem">
            <template #body="{ data }">
              <div class="flex flex-wrap items-center gap-2">
                <NuxtLink
                  :to="`/anuncios/previsualizar/${data.id}`"
                  class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-600 rounded transition"
                >
                  <i class="pi pi-eye mr-1"></i>
                  Ver
                </NuxtLink>
                <NuxtLink
                  :to="`/anuncios/editar/${data.id}`"
                  class="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-600 rounded transition"
                >
                  <i class="pi pi-pencil mr-1"></i>
                  Editar
                </NuxtLink>
                <Button
                  :icon="data.active ? 'pi pi-power-off' : 'pi pi-check-circle'"
                  :label="data.active ? 'Desactivar' : 'Activar'"
                  :severity="data.active ? 'danger' : 'success'"
                  size="small"
                  :loading="togglingId === data.id"
                  @click="() => toggleActive(data)"
                />
                <Button
                  v-if="data.paymentState === PaymentState.FAILED"
                  icon="pi pi-refresh"
                  label="Reintentar pago"
                  size="small"
                  severity="warning"
                  :loading="retryingId === data.id"
                  @click="() => retryPayment(data)"
                />
                <Button
                  icon="pi pi-trash"
                  label="Eliminar"
                  size="small"
                  severity="danger"
                  :loading="deletingId === data.id"
                  @click="() => confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <ConfirmDialog />
    </main>
  </div>
</template>

<script lang="ts" setup>
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { toast } from 'vue-sonner'
import { storeToRefs } from 'pinia'

import {
  searchAnuncios,
  deleteAnuncioById,
  toggleAnuncioActive,
  retryPaymentAnuncio,
  type AnuncioViewResponseDTO,
  type FilterAnuncios,
  AddType,
  PaymentState
} from '~/lib/api/anuncios/anuncio'

import { useAuthStore } from '~/stores/auth' // asumiendo ruta del store

const confirm = useConfirm()

const PAGE_SIZE = 20
const loading = ref(false)
const rows = ref<AnuncioViewResponseDTO[]>([])
const totalElements = ref(0)
const page = ref(0)

const deletingId = ref<string | null>(null)
const togglingId = ref<string | null>(null)
const retryingId = ref<string | null>(null)

const auth = useAuthStore()
const { user } = storeToRefs(auth)

const userID = computed(() => user.value?.userId as string)

const filters = reactive<FilterAnuncios>({
  type: null,
  paymentState: null,
  active: null,
  cinemaId: null,
  userId: userID.value
})

const typeOptions = [
  { label: 'Texto (Banner)', value: AddType.TEXT_BANNER },
  { label: 'Media Vertical', value: AddType.MEDIA_VERTICAL },
  { label: 'Media Horizontal', value: AddType.MEDIA_HORIZONTAL }
]
const stateOptions = [
  { label: 'Pendiente', value: PaymentState.PENDING },
  { label: 'Completado', value: PaymentState.COMPLETED },
  { label: 'Fallido', value: PaymentState.FAILED }
]
const activeOptions = [
  { label: '—', value: null },
  { label: 'Activos', value: true },
  { label: 'Inactivos', value: false }
]

async function runSearch(p = 0) {
  loading.value = true
  try {
    const clean: FilterAnuncios = {
      type: filters.type ?? null,
      paymentState: filters.paymentState ?? null,
      active: typeof filters.active === 'boolean' ? filters.active : null,
      cinemaId: filters.cinemaId?.trim() || null,
      // forzamos userId del store
      userId: (user.value?.userId as string) || null
    }
    const resp = await searchAnuncios(clean, p)
    rows.value = resp.content
    totalElements.value = resp.totalElements
    page.value = resp.number
  } catch (e: any) {
    rows.value = []
    totalElements.value = 0
    toast.error(e?.message)
  } finally {
    loading.value = false
  }
}

function onPageChange(e: any) {
  if (e?.page !== undefined && e.page !== page.value) {
    runSearch(e.page)
    if (process.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function resetFilters() {
  filters.type = null
  filters.paymentState = null
  filters.active = null
  filters.cinemaId = null
  runSearch(0)
}

function confirmDelete(row: AnuncioViewResponseDTO) {
  confirm.require({
    message: `¿Eliminar el anuncio "${row.description}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: () => remove(row.id)
  })
}

async function remove(id: string) {
  try {
    deletingId.value = id
    await deleteAnuncioById(id)
    toast.success('Anuncio eliminado')
    await runSearch(page.value)
  } catch (e: any) {
    toast.error(e?.message)
  } finally {
    deletingId.value = null
  }
}

async function toggleActive(row: AnuncioViewResponseDTO) {
  try {
    togglingId.value = row.id
    await toggleAnuncioActive(row.id)
    row.active = !row.active
    toast.success(row.active ? 'Anuncio activado' : 'Anuncio desactivado')
  } catch (e: any) {
    toast.error(e?.message)
  } finally {
    togglingId.value = null
  }
}

async function retryPayment(row: AnuncioViewResponseDTO) {
  try {
    retryingId.value = row.id
    await retryPaymentAnuncio(row.id)
    toast.success('Intento de pago reenviado correctamente')
    await runSearch(page.value)
  } catch (e: any) {
    toast.error(e?.message)
  } finally {
    retryingId.value = null
  }
}

function formatMoney(n?: number | null) {
  if (typeof n !== 'number') return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GTQ', maximumFractionDigits: 2 }).format(n)
  } catch {
    return String(n)
  }
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    const fixed = iso.replace(/(\.\d{3})\d+$/, '$1')
    let d = new Date(fixed)
    if (isNaN(d.getTime())) {
      const noFrac = iso.split('.')[0]
      d = new Date(noFrac)
    }
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}
</script>

<style scoped>
/* estilos mínimos */
</style>
