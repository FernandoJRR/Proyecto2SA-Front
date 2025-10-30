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
            Anuncios
          </h1>
          <p class="text-slate-600">
            Administra los anuncios por cine y usuario. Paginado desde el
            servidor.
          </p>
        </div>
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
          <Dropdown
            v-model="filters.cinemaId"
            :options="cinemaFilterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Cinema"
            class="w-full"
            :showClear="!companyId"
            filter
            :loading="cinemasLoading"
            @change="() => runSearch(0)"
          />
          <InputText
            v-model.trim="filters.userId"
            placeholder="User ID"
            class="w-full"
            @keydown.enter="() => runSearch(0)"
          />
          <div class="flex items-center justify-end gap-2">
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

          <Column field="contentType" header="Contenido" />
          <Column field="description" header="Descripción" />
          <Column field="cinemaId" header="Cinema" />
          <Column field="userId" header="Usuario" />

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

          <Column field="price" header="Precio">
            <template #body="{ data }">
              {{ formatMoney(data.price) }}
            </template>
          </Column>

          <Column field="paidAt" header="Pagado">
            <template #body="{ data }">
              {{ data.paidAt ? formatDate(data.paidAt) : "—" }}
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

          <Column header="Acciones" headerStyle="width:18rem">
            <template #body="{ data }">
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  :icon="data.active ? 'pi pi-power-off' : 'pi pi-check-circle'"
                  :label="data.active ? 'Desactivar' : 'Activar'"
                  :severity="data.active ? 'danger' : 'success'"
                  size="small"
                  :loading="togglingId === data.id"
                  @click="() => toggleActive(data)"
                />
                <Button v-if="isAdmin(role)"
                  icon="pi pi-trash"
                  label="Eliminar"
                  size="small"
                  severity="danger"
                  :loading="deletingId === data.id"
                  @click="() => confirmDelete(data)"
                />
                <NuxtLink
                  :to="`/admin/anuncios/previsualizar/${data.id}`"
                  class="p-button p-component p-button-text p-button-sm"
                >
                  <i class="pi pi-eye mr-2"></i>
                  Ver
                </NuxtLink>
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
import { computed, onMounted, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import Button from "primevue/button";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { toast } from "vue-sonner";

import {
  searchAnuncios,
  deleteAnuncioById,
  toggleAnuncioActive,
  type AnuncioViewResponseDTO,
  type FilterAnuncios,
  AddType,
  PaymentState,
} from "~/lib/api/anuncios/anuncio";
import { isAdmin } from "~/lib/auth/roles";
import { getAllCinemas, getCinemasByCompanyId, type CinemaResponseDTO } from "~/lib/api/cinema/cinema";
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const { rol, companyId } = storeToRefs(authStore);
const role = rol.value ?? null;

const confirm = useConfirm();

const PAGE_SIZE = 20;
const loading = ref(false);
const rows = ref<AnuncioViewResponseDTO[]>([]);
const totalElements = ref(0);
const page = ref(0);

const deletingId = ref<string | null>(null);
const togglingId = ref<string | null>(null);

const filters = reactive<FilterAnuncios>({
  type: null,
  paymentState: null,
  active: null,
  cinemaId: null,
  userId: null,
});

const typeOptions = [
  { label: "Texto (Banner)", value: AddType.TEXT_BANNER },
  { label: "Media Vertical", value: AddType.MEDIA_VERTICAL },
  { label: "Media Horizontal", value: AddType.MEDIA_HORIZONTAL },
];
const stateOptions = [
  { label: "Pendiente", value: PaymentState.PENDING },
  { label: "Completado", value: PaymentState.COMPLETED },
  { label: "Fallido", value: PaymentState.FAILED },
];
const activeOptions = [
  { label: "—", value: null },
  { label: "Activos", value: true },
  { label: "Inactivos", value: false },
];

const {
  state: cinemaState,
  asyncStatus: cinemaStatus,
  refetch: refetchCinemas,
} = useCustomQuery({
  key: ["anuncios-cinemas", companyId],
  query: () => {
    const id = companyId.value?.trim();
    return id ? getCinemasByCompanyId(id) : getAllCinemas();
  },
});

const cinemaOptions = computed<Array<{ label: string; value: string }>>(() =>
  (cinemaState.value.data ?? []).map((cinema: CinemaResponseDTO) => ({
    label: cinema.name,
    value: cinema.id,
  }))
);

const cinemaFilterOptions = computed(() => {
  if (companyId.value) {
    return cinemaOptions.value;
  }
  return [{ label: "— Todos los cines —", value: null }, ...cinemaOptions.value];
});

const cinemasLoading = computed(() => cinemaStatus.value === "loading");

async function runSearch(p = 0) {
  loading.value = true;
  try {
    if (companyId.value && cinemaStatus.value === "loading") {
      await refetchCinemas();
    }

    if (companyId.value && cinemaStatus.value === "error") {
      rows.value = [];
      totalElements.value = 0;
      toast.error("No se pudieron cargar los cines asociados a tu compañía.");
      return;
    }

    if (companyId.value) {
      const allowedIds = cinemaOptions.value.map((option) => option.value);
      if (filters.cinemaId && !allowedIds.includes(filters.cinemaId)) {
        filters.cinemaId = null;
      }
      if (!allowedIds.length) {
        rows.value = [];
        totalElements.value = 0;
        page.value = 0;
        return;
      }
      if (!filters.cinemaId) {
        filters.cinemaId = allowedIds[0];
      }
    }

    const clean: FilterAnuncios = {
      type: filters.type ?? null,
      paymentState: filters.paymentState ?? null,
      active: typeof filters.active === "boolean" ? filters.active : null,
      cinemaId: filters.cinemaId ?? null,
      userId: filters.userId?.trim() || null,
    };
    const resp = await searchAnuncios(clean, p);
    rows.value = resp.content;
    totalElements.value = resp.totalElements;
    page.value = resp.number;
  } catch (e: any) {
    rows.value = [];
    totalElements.value = 0;
    toast.error(e?.message);
  } finally {
    loading.value = false;
  }
}

function onPageChange(e: any) {
  if (e?.page !== undefined && e.page !== page.value) {
    runSearch(e.page);
    if (process.client) window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function resetFilters() {
  filters.type = null;
  filters.paymentState = null;
  filters.active = null;
  filters.cinemaId = null;
  filters.userId = null;
  runSearch(0);
}

function confirmDelete(row: AnuncioViewResponseDTO) {
  confirm.require({
    message: `¿Eliminar el anuncio "${row.description}"?`,
    header: "Confirmar eliminación",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancelar",
    acceptLabel: "Eliminar",
    acceptClass: "p-button-danger",
    accept: () => remove(row.id),
  });
}

async function remove(id: string) {
  try {
    deletingId.value = id;
    await deleteAnuncioById(id);
    toast.success("Anuncio eliminado");
    await runSearch(page.value);
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    deletingId.value = null;
  }
}

async function toggleActive(row: AnuncioViewResponseDTO) {
  try {
    togglingId.value = row.id;
    await toggleAnuncioActive(row.id);
    row.active = !row.active;
    toast.success(row.active ? "Anuncio activado" : "Anuncio desactivado");
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    togglingId.value = null;
  }
}

function formatMoney(n?: number | null) {
  if (typeof n !== "number") return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "GTQ",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return String(n);
  }
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    const fixed = iso.replace(/(\.\d{3})\d+$/, "$1");
    let d = new Date(fixed);
    if (isNaN(d.getTime())) {
      const noFrac = iso.split(".")[0];
      d = new Date(noFrac);
    }
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

onMounted(() => {
  runSearch(0);
});

watch(companyId, () => {
  filters.cinemaId = null;
  runSearch(0);
});
</script>

<style scoped>
/* estilos mínimos */
</style>
