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
              Ventas por cine
            </h1>
            <p class="text-slate-600 text-sm">
              Consulta el top de cines con mayor volumen de ventas en el periodo seleccionado.
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Desde * (fecha)
            </label>
            <Calendar
              v-model="form.from"
              class="w-full"
              dateFormat="yy-mm-dd"
              iconDisplay="input"
              placeholder="Selecciona fecha inicial"
            />
            <p v-if="errors.from" class="mt-1 text-sm text-red-600">
              {{ errors.from }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Hasta * (fecha)
            </label>
            <Calendar
              v-model="form.to"
              class="w-full"
              dateFormat="yy-mm-dd"
              iconDisplay="input"
              placeholder="Selecciona fecha final"
            />
            <p v-if="errors.to" class="mt-1 text-sm text-red-600">
              {{ errors.to }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Límite de cines (opcional)
            </label>
            <InputNumber
              v-model="form.limit"
              class="w-full"
              :min="1"
              :useGrouping="false"
              placeholder="Ej. 10"
            />
            <p v-if="errors.limit" class="mt-1 text-sm text-red-600">
              {{ errors.limit }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <main class="max-w-7xl mx-auto space-y-4" role="main">
      <!-- Summary -->
      <div
        v-if="report"
        class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <p class="text-xs uppercase text-slate-500 tracking-wide">
            Periodo
          </p>
          <p class="text-sm text-slate-700">
            {{ formatDate(report.from) }} → {{ formatDate(report.to) }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase text-slate-500 tracking-wide">
            Total ventas (Q)
          </p>
          <p class="text-xl font-semibold text-emerald-600">
            {{ formatCurrency(totalAmount) }}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            {{ rows.length }} cines listados · {{ formatNumber(totalSales) }} ventas registradas.
          </p>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow">
        <DataTable
          :value="rows"
          dataKey="cinemaId"
          :loading="loading"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          tableStyle="min-width: 60rem"
          stripedRows
          rowHover
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm text-slate-600">
                {{ rows.length }} cines encontrados.
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

          <Column field="cinemaName" header="Cine">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-medium text-slate-800">
                  {{ data.cinemaName || "—" }}
                </span>
                <span class="text-xs text-slate-500 font-mono">
                  {{ data.cinemaId }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="totalSales" header="Número de ventas" style="width: 10rem">
            <template #body="{ data }">
              <span class="font-semibold">{{ formatNumber(data.totalSales) }}</span>
            </template>
          </Column>
          <Column field="totalAmount" header="Monto total" style="width: 10rem">
            <template #body="{ data }">
              <span class="font-semibold text-indigo-600">{{ formatCurrency(data.totalAmount) }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>

    <PdfViewerModal
      v-model="showPdf"
      :blob="pdfBlob"
      title="Reporte de ventas por cine"
      file-name="reporte-ventas-por-cine.pdf"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import Button from "primevue/button";
import Calendar from "primevue/calendar";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputNumber from "primevue/inputnumber";
import { toast } from "vue-sonner";
import PdfViewerModal from "~/components/common/PdfViewerModal.vue";
import {
  reportDeVentasPorCine,
  reportDeVentasPorCinePdf,
  type CinemaSalesLineDTO,
  type CinemaSalesReportDTO,
  type CinemaSalesReportQuery,
} from "~/lib/api/reportes/reportes";

const form = reactive<{
  from: Date | null;
  to: Date | null;
  limit: number | null;
}>({
  from: null,
  to: null,
  limit: null,
});

const errors = reactive<{
  from: string | null;
  to: string | null;
  limit: string | null;
}>({
  from: null,
  to: null,
  limit: null,
});

const report = ref<CinemaSalesReportDTO | null>(null);
const loading = ref(false);
const pdfLoading = ref(false);
const pdfBlob = ref<Blob | null>(null);
const showPdf = ref(false);

const rows = computed<CinemaSalesLineDTO[]>(() => {
  return report.value?.cinemas ?? [];
});

const totalAmount = computed(() => {
  return rows.value.reduce((acc, row) => acc + (row.totalAmount ?? 0), 0);
});

const totalSales = computed(() => {
  return rows.value.reduce((acc, row) => acc + (row.totalSales ?? 0), 0);
});

const filtersApplied = computed(
  () => !!form.from || !!form.to || form.limit !== null
);

function validate() {
  errors.from = form.from ? null : "Selecciona una fecha de inicio.";
  errors.to = form.to ? null : "Selecciona una fecha final.";
  errors.limit = null;

  if (!errors.from && !errors.to && form.from && form.to) {
    if (form.from > form.to) {
      errors.to = "La fecha final debe ser posterior a la inicial.";
    }
  }

  if (form.limit !== null) {
    if (Number.isNaN(form.limit) || form.limit <= 0) {
      errors.limit = "Ingresa un límite mayor a cero.";
    }
  }

  return !errors.from && !errors.to && !errors.limit;
}

function toDateString(date: Date | null) {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildQuery(): CinemaSalesReportQuery | null {
  if (!validate()) return null;
  const query: CinemaSalesReportQuery = {
    from: toDateString(form.from)!,
    to: toDateString(form.to)!,
  };
  if (form.limit !== null && !Number.isNaN(form.limit)) {
    query.limit = form.limit;
  }
  return query;
}

async function runSearch() {
  const query = buildQuery();
  if (!query) return;

  loading.value = true;
  try {
    const response = await reportDeVentasPorCine(query);
    report.value = response;
    if (!response.cinemas.length) {
      toast.info("No se registraron ventas en ese periodo.");
    }
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.message ||
      "No se pudo obtener el reporte.";
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
    const blob = await reportDeVentasPorCinePdf(query);
    pdfBlob.value = blob;
    showPdf.value = true;
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.message ||
      "No se pudo generar el PDF.";
    toast.error(message);
  } finally {
    pdfLoading.value = false;
  }
}

function resetResults() {
  report.value = null;
  pdfBlob.value = null;
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "—";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return "—";
  try {
    return new Intl.NumberFormat("es-GT").format(numberValue);
  } catch {
    return `${numberValue}`;
  }
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "—";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return "—";
  try {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(numberValue);
  } catch {
    return `Q. ${numberValue.toFixed(2)}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-GT", {
      dateStyle: "medium",
    }).format(date);
  } catch {
    return value;
  }
}
</script>
