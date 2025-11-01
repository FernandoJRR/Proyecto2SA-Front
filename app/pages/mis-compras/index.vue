<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-6xl mx-auto mb-8" role="banner">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Mis compras
          </h1>
          <p class="text-slate-600">
            Consulta tus compras anteriores y revisa los detalles de cada venta.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="authenticated && clientId && !loading"
            class="hidden sm:inline-flex items-center text-sm text-slate-600"
          >
            {{ totalPurchases }}
            {{ totalPurchases === 1 ? "compra registrada" : "compras registradas" }}
          </span>
          <Button
            icon="pi pi-refresh"
            label="Actualizar"
            severity="secondary"
            text
            :disabled="!canRefresh"
            :loading="loading"
            @click="refetchSales"
          />
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto space-y-6" role="main">
      <div
        v-if="!authenticated"
        class="rounded-xl border border-slate-200 bg-white shadow p-8 text-center text-slate-600 space-y-3"
      >
        <i class="pi pi-lock text-3xl text-slate-400" aria-hidden="true"></i>
        <h2 class="text-lg font-semibold text-slate-900">Inicia sesión</h2>
        <p>Debes iniciar sesión para consultar tus compras.</p>
        <NuxtLink to="/login">
          <Button label="Ir a iniciar sesión" icon="pi pi-sign-in" />
        </NuxtLink>
      </div>

      <div
        v-else-if="!clientId"
        class="rounded-xl border border-amber-200 bg-amber-50 shadow p-8 text-center text-amber-700 space-y-3"
      >
        <i class="pi pi-exclamation-triangle text-3xl" aria-hidden="true"></i>
        <h2 class="text-lg font-semibold">No encontramos tu identificador.</h2>
        <p>Tu cuenta no tiene un identificador de cliente asignado aún.</p>
      </div>

      <div
        v-else-if="loading"
        class="rounded-xl border border-slate-200 bg-white shadow p-12 text-center text-slate-600 space-y-3"
      >
        <i class="pi pi-spinner pi-spin text-3xl mb-3" aria-hidden="true"></i>
        <p>Cargando tus compras…</p>
      </div>

      <div
        v-else-if="errorMessage"
        class="rounded-xl border border-red-200 bg-red-50 shadow p-8 text-center text-red-700 space-y-3"
      >
        <i class="pi pi-times-circle text-3xl" aria-hidden="true"></i>
        <h2 class="text-lg font-semibold">No se pudieron cargar las compras.</h2>
        <p>{{ errorMessage }}</p>
        <Button
          icon="pi pi-refresh"
          label="Intentar de nuevo"
          severity="danger"
          outlined
          @click="refetchSales"
        />
      </div>

      <div v-else class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          :value="sales"
          dataKey="id"
          :loading="loading"
          :paginator="true"
          :rows="rowsPerPage"
          :first="currentPage * rowsPerPage"
          :totalRecords="totalPurchases"
          :lazy="true"
          @page="handlePage"
          tableStyle="min-width: 60rem"
        >
          <template #empty>
            <div class="py-16 text-center text-slate-600 space-y-3">
              <i class="pi pi-inbox text-4xl text-slate-400" aria-hidden="true"></i>
              <div class="text-lg font-semibold text-slate-900">
                Aún no has realizado compras.
              </div>
              <p>Explora los cines y compra tus boletos o snacks favoritos.</p>
              <div class="flex flex-wrap items-center justify-center gap-3">
                <NuxtLink to="/tickets">
                  <Button icon="pi pi-ticket" label="Comprar tickets" />
                </NuxtLink>
                <NuxtLink to="/ventas">
                  <Button icon="pi pi-shopping-cart" label="Comprar snacks" severity="secondary" outlined />
                </NuxtLink>
              </div>
            </div>
          </template>

          <Column field="id" header="Venta" style="width: 28%">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-semibold text-slate-900 truncate">{{ data.id }}</span>
                <span class="text-xs text-slate-500">
                  Creada {{ formatDateTime(data.createdAt) }}
                </span>
              </div>
            </template>
          </Column>

          <Column header="Cine" style="width: 14%">
            <template #body="{ data }">
              <span class="font-mono text-xs text-slate-600">{{ data.cinemaId }}</span>
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

          <Column header="Estado" style="width: 12%">
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

          <Column header="Acciones" style="width: 14%">
            <template #body="{ data }">
              <NuxtLink :to="`/mis-compras/${data.id}`">
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
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { storeToRefs } from "pinia";
import Button from "primevue/button";
import Tag from "primevue/tag";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import type { DataTablePageEvent } from "primevue/datatable";
import { useAuthStore } from "~/stores/auth";
import { useCustomQuery } from "~/composables/useCustomQuery";
import {
  getSalesByClient,
  SaleStatusType,
  type SalePage,
  type SaleResponseDTO,
} from "~/lib/api/ventas/sales";

const authStore = useAuthStore();
const { authenticated, user } = storeToRefs(authStore);

const clientId = computed(() => user.value?.userId ?? "");

const rowsPerPage = 20;
const currentPage = ref(0);

function emptySalePage(): SalePage {
  return {
    content: [],
    totalElements: 0,
    numberOfElements: 0,
    totalPages: 0,
    size: 0,
    number: 0,
    first: true,
    last: true,
    empty: true,
    sort: { empty: true, sorted: false, unsorted: true },
    pageable: {
      pageNumber: 0,
      pageSize: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      offset: 0,
      paged: false,
      unpaged: true,
    },
  };
}

const {
  state: salesState,
  asyncStatus: salesStatus,
  refetch: refetchSales,
} = useCustomQuery({
  key: [
    "client-sales",
    () => clientId.value || "unassigned",
    () => currentPage.value,
  ],
  query: async () => {
    const id = clientId.value?.trim();
    if (!id) {
      return emptySalePage();
    }
    return getSalesByClient(id, currentPage.value);
  },
});

watch(clientId, () => {
  currentPage.value = 0;
  refetchSales();
});

const salesPage = computed<SalePage | null>(() => {
  const data = salesState.value.data as SalePage | undefined;
  return data ?? null;
});

const sales = computed<SaleResponseDTO[]>(() => salesPage.value?.content ?? []);
const totalPurchases = computed(
  () => salesPage.value?.totalElements ?? sales.value.length
);

const loading = computed(() => salesStatus.value === "loading");
const canRefresh = computed(() => !!clientId.value && !loading.value);

const errorMessage = computed(() => {
  const maybeError = salesState.value.error as
    | { message?: string; data?: { message?: string } }
    | undefined;
  return maybeError?.data?.message ?? maybeError?.message ?? null;
});

watch(salesPage, (page) => {
  const total = page?.totalElements ?? 0;
  const maxPage =
    total > 0 ? Math.max(Math.ceil(total / rowsPerPage) - 1, 0) : 0;
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
    refetchSales();
  }
});

function handlePage(event: DataTablePageEvent) {
  currentPage.value = event.page ?? 0;
  refetchSales();
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
