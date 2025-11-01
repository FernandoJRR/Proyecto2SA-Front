<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-6xl mx-auto mb-6" role="banner">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/mis-compras">
            <Button
              icon="pi pi-arrow-left"
              label="Volver"
              size="small"
              aria-label="Volver al listado de compras"
            />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Detalle de la compra
            </h1>
            <p class="text-sm text-slate-600">
              Venta #{{ saleId }}
            </p>
          </div>
        </div>
        <Tag
          v-if="sale"
          :value="formatStatus(sale.status)"
          :severity="statusSeverity(sale.status)"
          rounded
        />
      </div>
    </header>

    <main class="max-w-6xl mx-auto space-y-6" role="main">
      <div
        v-if="loading"
        class="rounded-xl border border-slate-200 bg-white shadow p-12 text-center text-slate-600 space-y-3"
      >
        <i class="pi pi-spinner pi-spin text-3xl mb-3" aria-hidden="true"></i>
        <p>Cargando información de la venta…</p>
      </div>

      <div
        v-else-if="errorMessage"
        class="rounded-xl border border-red-200 bg-red-50 shadow p-8 text-center text-red-700 space-y-3"
      >
        <i class="pi pi-times-circle text-3xl" aria-hidden="true"></i>
        <h2 class="text-lg font-semibold">No se pudo obtener la venta.</h2>
        <p>{{ errorMessage }}</p>
        <Button
          icon="pi pi-refresh"
          label="Intentar nuevamente"
          severity="danger"
          outlined
          @click="() => refetchSale()"
        />
      </div>

      <div
        v-else-if="!sale"
        class="rounded-xl border border-slate-200 bg-white shadow p-12 text-center text-slate-600 space-y-3"
      >
        <i class="pi pi-question-circle text-3xl text-slate-400" aria-hidden="true"></i>
        <p>No encontramos la venta solicitada.</p>
      </div>

      <div v-else class="space-y-6">
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="bg-slate-900 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-300">
                Venta #{{ sale.id }}
              </p>
              <h2 class="text-xl font-semibold">
                {{ formatCurrency(sale.totalAmount) }}
              </h2>
              <p class="text-sm text-slate-200">
                Realizada el {{ formatDateTime(sale.createdAt) }}
              </p>
            </div>
            <div class="text-sm text-slate-200 space-y-1 text-right">
              <p>
                Cliente:
                <span class="font-semibold text-white">{{ sale.clientId }}</span>
              </p>
              <p>
                Cine:
                <span class="font-semibold text-white">
                  {{ cinema?.name ?? "Cine no disponible" }}
                </span>
              </p>
              <p>
                Teléfono:
                <span class="font-semibold text-white">
                  {{ cinema?.company?.phoneNumber ?? "—" }}
                </span>
              </p>
            </div>
          </div>
          <div class="p-6 sm:p-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600">
              <div class="space-y-1">
                <p class="font-semibold text-slate-700 uppercase text-xs tracking-wide">
                  Totales
                </p>
                <p>Total pagado: <span class="font-semibold text-slate-900">{{ formatCurrency(sale.totalAmount) }}</span></p>
                <p>Descuento: <span class="font-semibold text-slate-900">{{ formatCurrency(sale.discountedAmount) }}</span></p>
                <p>Reclamado: <span class="font-semibold text-slate-900">{{ formatCurrency(sale.claimedAmount) }}</span></p>
              </div>
              <div class="space-y-1">
                <p class="font-semibold text-slate-700 uppercase text-xs tracking-wide">
                  Estado y pago
                </p>
                <p>Estado actual: <span class="font-semibold text-slate-900">{{ formatStatus(sale.status) }}</span></p>
                <p>Última actualización: <span class="font-semibold text-slate-900">{{ formatDateTime(sale.updatedAt) }}</span></p>
                <p>Pagado el: <span class="font-semibold text-slate-900">{{ sale.paidAt ? formatDateTime(sale.paidAt) : "Pendiente" }}</span></p>
              </div>
              <div class="space-y-1">
                <p class="font-semibold text-slate-700 uppercase text-xs tracking-wide">
                  Referencias
                </p>
                <p>Venta:
                  <span class="font-mono text-xs text-slate-700">
                    {{ sale.id }}
                  </span>
                </p>
                <p>Cliente:
                  <span class="font-mono text-xs text-slate-700">
                    {{ sale.clientId }}
                  </span>
                </p>
                <p>Cine:
                  <span class="font-mono text-xs text-slate-700">
                    {{ sale.cinemaId }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8 space-y-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Snacks</h2>
              <p class="text-sm text-slate-600">
                Productos de confitería incluidos en esta compra.
              </p>
            </div>
            <span class="text-sm text-slate-600">
              {{ sale.saleLineSnacks.length }}
              {{ sale.saleLineSnacks.length === 1 ? "snack" : "snacks" }}
            </span>
          </div>

          <DataTable
            :value="sale.saleLineSnacks"
            dataKey="id"
            :paginator="sale.saleLineSnacks.length > 5"
            :rows="5"
            :rowsPerPageOptions="[5, 10]"
            tableStyle="min-width: 40rem"
          >
            <template #empty>
              <div class="py-8 text-center text-slate-500">
                Esta venta no incluye snacks.
              </div>
            </template>

            <Column header="Snack">
              <template #body="{ data }">
                <div class="flex flex-col">
                  <span class="font-semibold text-slate-900">
                    {{ data.snack?.name ?? "Snack" }}
                  </span>
                  <span class="text-xs text-slate-500">
                    ID: {{ data.snackId }}
                  </span>
                </div>
              </template>
            </Column>

            <Column header="Cantidad" style="width: 10%">
              <template #body="{ data }">
                <span class="font-semibold text-slate-900">
                  {{ data.quantity }}
                </span>
              </template>
            </Column>

            <Column header="Unidad" style="width: 15%">
              <template #body="{ data }">
                {{ formatCurrency(data.unitPrice) }}
              </template>
            </Column>

            <Column header="Subtotal" style="width: 15%">
              <template #body="{ data }">
                {{ formatCurrency(data.totalPrice) }}
              </template>
            </Column>
          </DataTable>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8 space-y-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Tickets</h2>
              <p class="text-sm text-slate-600">
                Funciones y boletos digitales incluidos en la venta.
              </p>
            </div>
            <span class="text-sm text-slate-600">
              {{ sale.saleLineTickets.length }}
              {{ sale.saleLineTickets.length === 1 ? "ticket" : "tickets" }}
            </span>
          </div>

          <DataTable
            :value="sale.saleLineTickets"
            dataKey="id"
            :paginator="sale.saleLineTickets.length > 5"
            :rows="5"
            :rowsPerPageOptions="[5, 10]"
            tableStyle="min-width: 40rem"
          >
            <template #empty>
              <div class="py-8 text-center text-slate-500">
                Esta venta no incluye tickets.
              </div>
            </template>

            <Column header="Función">
              <template #body="{ data }">
                <div class="flex flex-col">
                  <span class="font-semibold text-slate-900">
                    {{ data.ticketView?.cinemaFunctionId ?? "Función N/D" }}
                  </span>
                  <span class="text-xs text-slate-500">
                    Ticket: {{ data.ticketView?.id ?? "—" }}
                  </span>
                </div>
              </template>
            </Column>

            <Column header="Cantidad" style="width: 10%">
              <template #body="{ data }">
                <span class="font-semibold text-slate-900">
                  {{ data.quantity }}
                </span>
              </template>
            </Column>

            <Column header="Estado" style="width: 18%">
              <template #body="{ data }">
                <Tag :value="data.status" severity="info" rounded />
              </template>
            </Column>

            <Column header="Total" style="width: 15%">
              <template #body="{ data }">
                {{ formatCurrency(data.totalPrice) }}
              </template>
            </Column>
          </DataTable>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import Button from "primevue/button";
import Tag from "primevue/tag";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useCustomQuery } from "~/composables/useCustomQuery";
import {
  getSaleById,
  SaleStatusType,
  type SaleResponseDTO,
} from "~/lib/api/ventas/sales";
import {
  getCinemaById,
  type CinemaResponseDTO,
} from "~/lib/api/cinema/cinema";

const route = useRoute();

const saleId = computed(() => {
  const value = route.params.id;
  if (Array.isArray(value)) return value[0] ?? "";
  return String(value ?? "");
});

const {
  state: saleState,
  asyncStatus: saleStatus,
  refetch: refetchSale,
} = useCustomQuery({
  key: ["client-sale-detail", () => saleId.value],
  query: async () => {
    const id = saleId.value?.trim();
    if (!id) {
      throw new Error("Identificador de venta no disponible.");
    }
    return getSaleById(id);
  },
});

const sale = computed<SaleResponseDTO | null>(() => {
  const data = saleState.value.data as SaleResponseDTO | undefined;
  return data ?? null;
});

const cinemaId = computed(() => sale.value?.cinemaId ?? "");

const {
  state: cinemaState,
} = useCustomQuery({
  key: ["client-sale-cinema", () => cinemaId.value || "unassigned"],
  query: async () => {
    const id = cinemaId.value?.trim();
    if (!id) {
      return null as CinemaResponseDTO | null;
    }
    return getCinemaById(id);
  },
});

const cinema = computed<CinemaResponseDTO | null>(() => {
  const data = cinemaState.value.data as CinemaResponseDTO | null | undefined;
  return data ?? null;
});

const loading = computed(() => saleStatus.value === "loading");

const errorMessage = computed(() => {
  const maybeError = saleState.value.error as
    | { message?: string; data?: { message?: string } }
    | undefined;
  return maybeError?.data?.message ?? maybeError?.message ?? null;
});

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
