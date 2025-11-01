<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-7xl mx-auto mb-8" role="banner">
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Ventas por cine
          </h1>
          <p class="text-slate-600">
            Selecciona un cine para visualizar sus ventas y administrar los registros.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            v-if="selectedCinemaId"
            :to="`/ventas/cine-${selectedCinemaId}`"
          >
            <Button
              icon="pi pi-plus"
              label="Crear nueva venta"
              :disabled="!selectedCinemaId"
            />
          </NuxtLink>
          <Button
            icon="pi pi-refresh"
            label="Actualizar"
            severity="secondary"
            text
            :disabled="!selectedCinemaId || loadingSales"
            :loading="loadingSales"
            @click="() => refetchSales()"
          />
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto space-y-6" role="main">
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
        <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2" for="cinema">
              Cine *
            </label>
            <Dropdown
              id="cinema"
              v-model="selectedCinemaId"
              :options="cinemaOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona un cine"
              class="w-full"
              :loading="cinemasLoading"
              :disabled="cinemasLoading || !cinemaOptions.length"
              filter
            />
            <small v-if="cinemaError" class="block text-red-600 mt-1">
              {{ cinemaError }}
            </small>
            <p v-else-if="!cinemaOptions.length && !cinemasLoading" class="text-xs text-slate-500 mt-1">
              No se encontraron cines disponibles para tu cuenta.
            </p>
          </div>
          <div class="flex flex-col justify-center gap-2 text-sm text-slate-600">
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-700">Ventas registradas</span>
              <span class="font-semibold text-slate-900">{{ totalSales }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-700">Página actual</span>
              <span class="font-semibold text-slate-900">
                {{ currentPage + 1 }} / {{ totalPages }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="loadingCinemas"
        class="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center text-slate-600 space-y-3"
      >
        <i class="pi pi-spinner pi-spin text-3xl" aria-hidden="true"></i>
        <p>Cargando cines disponibles…</p>
      </section>

      <section
        v-else-if="errorMessage"
        class="rounded-2xl border border-red-200 bg-red-50 shadow-sm p-10 text-center text-red-700 space-y-3"
      >
        <i class="pi pi-times-circle text-3xl" aria-hidden="true"></i>
        <p class="text-lg font-semibold">No se pudieron obtener las ventas.</p>
        <p>{{ errorMessage }}</p>
        <Button
          icon="pi pi-refresh"
          label="Intentar nuevamente"
          severity="danger"
          outlined
          @click="() => refetchSales()"
        />
      </section>

      <section
        v-else-if="!selectedCinemaId"
        class="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center text-slate-600 space-y-3"
      >
        <i class="pi pi-eye text-3xl text-slate-400" aria-hidden="true"></i>
        <p>Selecciona un cine para visualizar sus ventas.</p>
      </section>

      <section
        v-else
        class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <DataTable
          :value="sales"
          dataKey="id"
          :loading="loadingSales"
          :paginator="true"
          :rows="rowsPerPage"
          :first="currentPage * rowsPerPage"
          :totalRecords="totalSales"
          :lazy="true"
          @page="handlePage"
          tableStyle="min-width: 70rem"
        >
          <template #empty>
            <div class="py-16 text-center text-slate-600 space-y-3">
              <i class="pi pi-inbox text-4xl text-slate-400" aria-hidden="true"></i>
              <div class="text-lg font-semibold text-slate-900">
                No se registran ventas para este cine.
              </div>
              <p>Selecciona otro cine o crea una nueva venta.</p>
            </div>
          </template>

          <Column header="Venta" style="width: 24%">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-semibold text-slate-900 truncate">
                  {{ data.id }}
                </span>
                <span class="text-xs text-slate-500">
                  {{ formatDateTime(data.createdAt) }}
                </span>
              </div>
            </template>
          </Column>

          <Column header="Cliente" style="width: 18%">
            <template #body="{ data }">
              <span class="font-mono text-xs text-slate-600">
                {{ data.clientId }}
              </span>
            </template>
          </Column>

          <Column header="Totales" style="width: 18%">
            <template #body="{ data }">
              <div class="flex flex-col text-sm text-slate-600">
                <span class="font-semibold text-slate-900">
                  {{ formatCurrency(data.totalAmount) }}
                </span>
                <span class="text-xs">
                  Descuento: {{ formatCurrency(data.discountedAmount) }}
                </span>
              </div>
            </template>
          </Column>

          <Column header="Estado" style="width: 14%">
            <template #body="{ data }">
              <Tag
                :value="formatStatus(data.status)"
                :severity="statusSeverity(data.status)"
                rounded
              />
            </template>
          </Column>

          <Column header="Actualización" style="width: 14%">
            <template #body="{ data }">
              <span class="text-xs text-slate-600">
                {{ formatDateTime(data.updatedAt) }}
              </span>
            </template>
          </Column>

          <Column header="Acciones" style="width: 12%">
            <template #body="{ data }">
              <NuxtLink :to="`/ventas/${data.id}`">
                <Button
                  icon="pi pi-search"
                  label="Ver detalle"
                  size="small"
                  outlined
                />
              </NuxtLink>
            </template>
          </Column>
        </DataTable>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import type { DataTablePageEvent } from "primevue/datatable";
import { useAuthStore } from "~/stores/auth";
import { useCustomQuery } from "~/composables/useCustomQuery";
import {
  getAllCinemas,
  getCinemasByCompanyId,
  type CinemaResponseDTO,
} from "~/lib/api/cinema/cinema";
import {
  getSalesByCinema,
  SaleStatusType,
  type SalePage,
  type SaleResponseDTO,
} from "~/lib/api/ventas/sales";

const authStore = useAuthStore();
const { companyId } = storeToRefs(authStore);

const rowsPerPage = 20;
const currentPage = ref(0);
const selectedCinemaId = ref<string>("");

const {
  state: cinemasState,
  asyncStatus: cinemasStatus,
  refetch: refetchCinemas,
} = useCustomQuery({
  key: ["ventas-cinemas", () => companyId.value ?? null],
  query: () => {
    const id = companyId.value?.trim();
    return id ? getCinemasByCompanyId(id) : getAllCinemas();
  },
});

const cinemas = computed<CinemaResponseDTO[]>(() => {
  const data = cinemasState.value.data as CinemaResponseDTO[] | undefined;
  return data ?? [];
});

const cinemaOptions = computed(() =>
  cinemas.value.map((cinema) => ({
    label: cinema.name,
    value: cinema.id,
  }))
);

const cinemasLoading = computed(() => cinemasStatus.value === "loading");
const loadingCinemas = cinemasLoading;

const cinemaError = computed(() => {
  const maybeError = cinemasState.value.error as
    | { message?: string; data?: { message?: string } }
    | undefined;
  return maybeError?.data?.message ?? maybeError?.message ?? null;
});

watch(companyId, () => {
  refetchCinemas();
});

watch(cinemas, (list) => {
  if (!list.length) {
    selectedCinemaId.value = "";
    return;
  }
  if (!selectedCinemaId.value || !list.some((cinema) => cinema.id === selectedCinemaId.value)) {
    selectedCinemaId.value = list[0].id;
  }
}, { immediate: true });

const emptySalePage = (): SalePage => ({
  content: [],
  totalElements: 0,
  numberOfElements: 0,
  totalPages: 0,
  size: rowsPerPage,
  number: 0,
  first: true,
  last: true,
  empty: true,
  sort: { empty: true, sorted: false, unsorted: true },
  pageable: {
    pageNumber: 0,
    pageSize: rowsPerPage,
    offset: 0,
    paged: false,
    unpaged: true,
    sort: { empty: true, sorted: false, unsorted: true },
  },
});

const {
  state: salesState,
  asyncStatus: salesStatus,
  refetch: refetchSales,
} = useCustomQuery({
  key: [
    "cinema-sales",
    () => selectedCinemaId.value || "unassigned",
    () => currentPage.value,
  ],
  query: async () => {
    const id = selectedCinemaId.value?.trim();
    if (!id) return emptySalePage();
    return getSalesByCinema(id, currentPage.value);
  },
});

watch(selectedCinemaId, (id, old) => {
  if (id === old) return;
  currentPage.value = 0;
  if (id) {
    refetchSales();
  }
});

watch(cinemasState, () => {
  currentPage.value = 0;
});

const salesPage = computed<SalePage | null>(() => {
  const data = salesState.value.data as SalePage | undefined;
  return data ?? null;
});

const sales = computed<SaleResponseDTO[]>(() => salesPage.value?.content ?? []);
const totalSales = computed(() => salesPage.value?.totalElements ?? 0);
const totalPages = computed(() => {
  const total = totalSales.value;
  if (total === 0) return 1;
  return Math.max(Math.ceil(total / rowsPerPage), 1);
});

const loadingSales = computed(() => salesStatus.value === "loading");

const errorMessage = computed(() => {
  const maybeError = salesState.value.error as
    | { message?: string; data?: { message?: string } }
    | undefined;
  return maybeError?.data?.message ?? maybeError?.message ?? null;
});

watch(salesPage, (page) => {
  const total = page?.totalElements ?? 0;
  const maxPage = total > 0 ? Math.max(Math.ceil(total / rowsPerPage) - 1, 0) : 0;
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
    if (selectedCinemaId.value) {
      refetchSales();
    }
  }
});

function handlePage(event: DataTablePageEvent) {
  currentPage.value = event.page ?? 0;
  if (selectedCinemaId.value) {
    refetchSales();
  }
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Q0.00";
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-GT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: SaleStatusType) {
  const map: Record<SaleStatusType, string> = {
    [SaleStatusType.PENDING]: "Pendiente",
    [SaleStatusType.PAID]: "Pagada",
    [SaleStatusType.PAID_ERROR]: "Error de pago",
    [SaleStatusType.CANCELLED]: "Cancelada",
  };
  return map[status] ?? status;
}

function statusSeverity(status: SaleStatusType) {
  switch (status) {
    case SaleStatusType.PAID:
      return "success";
    case SaleStatusType.PENDING:
      return "warn";
    case SaleStatusType.PAID_ERROR:
      return "danger";
    case SaleStatusType.CANCELLED:
      return "secondary";
    default:
      return "info";
  }
}
</script>
