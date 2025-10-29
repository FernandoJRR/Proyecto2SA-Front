<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <!-- Header -->
    <header class="max-w-7xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/reportes">
            <Button
              icon="pi pi-arrow-left"
              label="Volver"
              size="small"
              aria-label="Volver a reportes"
            />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Reporte de anuncios comprados
            </h1>
            <p class="text-slate-600 text-sm">
              Filtra por rango de fechas, tipo de anuncio y periodo de facturación.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            icon="pi pi-file-pdf"
            label="Ver PDF"
            severity="danger"
            :loading="pdfLoading"
            @click="generatePdf"
          />
          <Button
            icon="pi pi-search"
            label="Buscar"
            :loading="loading"
            @click="runSearch"
          />
        </div>
      </div>
    </header>

    <!-- Filters -->
    <section class="max-w-7xl mx-auto mb-6" aria-label="Filtros del reporte">
      <div class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Desde * (fecha y hora)
            </label>
            <Calendar
              v-model="form.from"
              showTime
              hourFormat="24"
              iconDisplay="input"
              class="w-full"
              dateFormat="yy-mm-dd"
              placeholder="Selecciona fecha y hora inicial"
            />
            <p v-if="errors.from" class="mt-1 text-sm text-red-600">
              {{ errors.from }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Hasta * (fecha y hora)
            </label>
            <Calendar
              v-model="form.to"
              showTime
              hourFormat="24"
              iconDisplay="input"
              class="w-full"
              dateFormat="yy-mm-dd"
              placeholder="Selecciona fecha y hora final"
            />
            <p v-if="errors.to" class="mt-1 text-sm text-red-600">
              {{ errors.to }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Tipo de anuncio
            </label>
            <Dropdown
              v-model="form.addType"
              :options="addTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos los tipos"
              class="w-full"
              showClear
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Periodo desde (solo fecha)
            </label>
            <Calendar
              v-model="form.periodFrom"
              iconDisplay="input"
              class="w-full"
              dateFormat="yy-mm-dd"
              placeholder="Ej. 2025-01-01"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Periodo hasta (solo fecha)
            </label>
            <Calendar
              v-model="form.periodTo"
              iconDisplay="input"
              class="w-full"
              dateFormat="yy-mm-dd"
              placeholder="Ej. 2025-01-31"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Table -->
    <main class="max-w-7xl mx-auto" role="main">
      <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow">
        <DataTable
          :value="rows"
          dataKey="id"
          :loading="loading"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          tableStyle="min-width: 64rem"
          stripedRows
          rowHover
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm text-slate-600">
                Total:
                <span class="font-semibold">{{ rows.length }}</span>
              </span>
              <Button
                icon="pi pi-refresh"
                label="Limpiar resultados"
                severity="secondary"
                text
                :disabled="!rows.length && !filtersApplied"
                @click="resetResults"
              />
            </div>
          </template>

          <Column field="id" header="ID">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.id }}</span>
            </template>
          </Column>
          <Column field="description" header="Descripción">
            <template #body="{ data }">
              <div class="max-w-xs">
                <p class="font-medium text-slate-800 truncate" :title="data.description">
                  {{ data.description || "Sin descripción" }}
                </p>
                <small class="text-xs text-slate-500 block truncate" :title="data.content">
                  {{ data.content }}
                </small>
              </div>
            </template>
          </Column>
          <Column field="type" header="Tipo">
            <template #body="{ data }">
              <Tag :value="addTypeLabel(data.type)" />
            </template>
          </Column>
          <Column field="price" header="Precio">
            <template #body="{ data }">
              {{ formatCurrency(data.price) }}
            </template>
          </Column>
          <Column field="paymentState" header="Estado pago">
            <template #body="{ data }">
              <Tag :value="paymentStateLabel(data.paymentState)" :severity="paymentStateSeverity(data.paymentState)" />
            </template>
          </Column>
          <Column field="paidAt" header="Pagado">
            <template #body="{ data }">
              {{ formatDateTime(data.paidAt) }}
            </template>
          </Column>
          <Column field="addExpiration" header="Expira">
            <template #body="{ data }">
              {{ formatDateTime(data.addExpiration) }}
            </template>
          </Column>
          <Column field="cinemaId" header="Cine">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.cinemaId }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>

    <PdfViewerModal
      v-model="showPdf"
      :blob="pdfBlob"
      title="Reporte de anuncios comprados"
      file-name="reporte-anuncios-comprados.pdf"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import Button from "primevue/button";
import Calendar from "primevue/calendar";
import Dropdown from "primevue/dropdown";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import { toast } from "vue-sonner";
import PdfViewerModal from "~/components/common/PdfViewerModal.vue";
import {
  anunciosComprados,
  anunciosCompradosPdf,
  type AnunciosComradosQuery,
} from "~/lib/api/reportes/reportes";
import {
  AddType,
  PaymentState,
  type AnuncioViewResponseDTO,
} from "~/lib/api/anuncios/anuncio";

const form = reactive<{
  from: Date | null;
  to: Date | null;
  addType: AddType | null;
  periodFrom: Date | null;
  periodTo: Date | null;
}>({
  from: null,
  to: null,
  addType: null,
  periodFrom: null,
  periodTo: null,
});

const errors = reactive<{ from: string | null; to: string | null }>({
  from: null,
  to: null,
});

const rows = ref<AnuncioViewResponseDTO[]>([]);
const loading = ref(false);
const pdfLoading = ref(false);
const pdfBlob = ref<Blob | null>(null);
const showPdf = ref(false);

const addTypeOptions = [
  { label: "Texto (Banner)", value: AddType.TEXT_BANNER },
  { label: "Media vertical", value: AddType.MEDIA_VERTICAL },
  { label: "Media horizontal", value: AddType.MEDIA_HORIZONTAL },
];

const filtersApplied = computed(
  () =>
    !!form.from ||
    !!form.to ||
    !!form.addType ||
    !!form.periodFrom ||
    !!form.periodTo
);

function validate() {
  errors.from = form.from ? null : "Selecciona una fecha de inicio.";
  errors.to = form.to ? null : "Selecciona una fecha final.";

  if (!errors.from && !errors.to && form.from && form.to) {
    if (form.from > form.to) {
      errors.to = "La fecha final debe ser posterior a la inicial.";
    }
  }

  return !errors.from && !errors.to;
}

function toDateTimeString(date: Date | null) {
  if (!date) return undefined;
  return new Date(date).toISOString();
}

function toDateString(date: Date | null) {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildQuery(): AnunciosComradosQuery | null {
  if (!validate()) return null;
  return {
    from: toDateTimeString(form.from)!,
    to: toDateTimeString(form.to)!,
    addType: form.addType ?? undefined,
    periodFrom: toDateString(form.periodFrom),
    periodTo: toDateString(form.periodTo),
  };
}

async function runSearch() {
  const query = buildQuery();
  if (!query) return;

  loading.value = true;
  try {
    const response = await anunciosComprados(query);
    rows.value = response;
    if (!response.length) {
      toast.info("No se encontraron anuncios para los filtros seleccionados.");
    }
  } catch (error: any) {
    const message = error?.data?.message || error?.message || "No se pudo obtener el reporte.";
    toast.error(message);
  } finally {
    loading.value = false;
  }
}

async function generatePdf() {
  const query = buildQuery();
  if (!query) return;

  pdfLoading.value = true;
  try {
    const blob = await anunciosCompradosPdf(query);
    pdfBlob.value = blob;
    showPdf.value = true;
  } catch (error: any) {
    const message = error?.data?.message || error?.message || "No se pudo generar el PDF.";
    toast.error(message);
  } finally {
    pdfLoading.value = false;
  }
}

function resetResults() {
  rows.value = [];
  pdfBlob.value = null;
}

function addTypeLabel(type: AddType) {
  const map: Record<AddType, string> = {
    [AddType.TEXT_BANNER]: "Texto (Banner)",
    [AddType.MEDIA_VERTICAL]: "Media vertical",
    [AddType.MEDIA_HORIZONTAL]: "Media horizontal",
  };
  return map[type] || type;
}

function paymentStateLabel(state: PaymentState) {
  const map: Record<PaymentState, string> = {
    [PaymentState.PENDING]: "Pendiente",
    [PaymentState.COMPLETED]: "Completado",
    [PaymentState.FAILED]: "Fallido",
  };
  return map[state] || state;
}

function paymentStateSeverity(state: PaymentState) {
  const map: Record<PaymentState, "info" | "success" | "danger" | "warn" | "secondary"> =
    {
      [PaymentState.PENDING]: "info",
      [PaymentState.COMPLETED]: "success",
      [PaymentState.FAILED]: "danger",
    };
  return map[state] || "secondary";
}

function formatCurrency(value: number) {
  if (Number.isNaN(Number(value))) return "—";
  try {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(value);
  } catch {
    return `Q. ${Number(value).toFixed(2)}`;
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-GT", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return value;
  }
}
</script>
