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
              Snacks vendidos por cine
            </h1>
            <p class="text-slate-600 text-sm">
              Consulta las ventas de snacks por cine en el periodo seleccionado.
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
              Cine ID *
            </label>
            <InputText
              v-model.trim="form.cinemaId"
              class="w-full"
              placeholder="UUID del cine"
            />
            <p v-if="errors.cinemaId" class="mt-1 text-sm text-red-600">
              {{ errors.cinemaId }}
            </p>
          </div>
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
        </div>
      </div>
    </section>

    <!-- Summary -->
    <main class="max-w-7xl mx-auto space-y-4" role="main">
      <div
        v-if="report"
        class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <p class="text-xs uppercase text-slate-500 tracking-wide">
            Cine
          </p>
          <p class="text-lg font-semibold text-slate-900">
            {{ report.cinema?.name || report.cinema?.id || form.cinemaId }}
          </p>
          <p class="text-sm text-slate-600">
            ID: <span class="font-mono">{{ report.cinema?.id || "—" }}</span>
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase text-slate-500 tracking-wide">
            Periodo
          </p>
          <p class="text-sm text-slate-700">
            {{ formatDate(report.from) }} → {{ formatDate(report.to) }}
          </p>
          <p class="mt-2 text-xs uppercase text-slate-500 tracking-wide">
            Total vendido
          </p>
          <p class="text-xl font-semibold text-emerald-600">
            {{ formatCurrency(report.totalAmount) }}
          </p>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow">
        <DataTable
          :value="rows"
          dataKey="snackId"
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
                {{ rows.length }} snacks encontrados.
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

          <Column field="snack.name" header="Snack">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-medium text-slate-800">
                  {{ data.snack?.name || "—" }}
                </span>
                <span class="text-xs text-slate-500 font-mono">
                  {{ data.snackId }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="snack.price" header="Precio unitario">
            <template #body="{ data }">
              {{ formatCurrency(data.snack?.price) }}
            </template>
          </Column>
          <Column field="totalQuantity" header="Cantidad vendida">
            <template #body="{ data }">
              <span class="font-semibold">{{ data.totalQuantity }}</span>
            </template>
          </Column>
          <Column field="totalAmount" header="Total">
            <template #body="{ data }">
              {{ formatCurrency(data.totalAmount) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </main>

    <PdfViewerModal
      v-model="showPdf"
      :blob="pdfBlob"
      title="Reporte de snacks vendidos por cine"
      file-name="reporte-snacks-cine.pdf"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import Button from "primevue/button";
import Calendar from "primevue/calendar";
import InputText from "primevue/inputtext";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { toast } from "vue-sonner";
import PdfViewerModal from "~/components/common/PdfViewerModal.vue";
import {
  snackSalesByCinemaReport,
  snackSalesByCinemaReportPdf,
  type SnackSalesByCinemaQuery,
  type SnackReportByCinemaReportDTO,
  type SnackSalesByCinemaDTO,
} from "~/lib/api/reportes/reportes";

const form = reactive<{
  cinemaId: string;
  from: Date | null;
  to: Date | null;
}>({
  cinemaId: "",
  from: null,
  to: null,
});

const errors = reactive<{
  cinemaId: string | null;
  from: string | null;
  to: string | null;
}>({
  cinemaId: null,
  from: null,
  to: null,
});

const report = ref<SnackReportByCinemaReportDTO | null>(null);
const loading = ref(false);
const pdfLoading = ref(false);
const pdfBlob = ref<Blob | null>(null);
const showPdf = ref(false);

const rows = computed<SnackSalesByCinemaDTO[]>(() => {
  return report.value?.snackSalesByCinemaDTOs ?? [];
});

const filtersApplied = computed(
  () => !!form.cinemaId || !!form.from || !!form.to
);

function validate() {
  form.cinemaId = form.cinemaId.trim();
  errors.cinemaId = form.cinemaId ? null : "Ingresa el ID del cine.";
  errors.from = form.from ? null : "Selecciona una fecha de inicio.";
  errors.to = form.to ? null : "Selecciona una fecha final.";

  if (!errors.from && !errors.to && form.from && form.to) {
    if (form.from > form.to) {
      errors.to = "La fecha final debe ser posterior a la inicial.";
    }
  }

  return !errors.cinemaId && !errors.from && !errors.to;
}

function toDateString(date: Date | null) {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildQuery(): SnackSalesByCinemaQuery | null {
  if (!validate()) return null;
  return {
    from: toDateString(form.from)!,
    to: toDateString(form.to)!,
  };
}

async function runSearch() {
  const query = buildQuery();
  if (!query) return;

  loading.value = true;
  try {
    const response = await snackSalesByCinemaReport(form.cinemaId, query);
    report.value = response;
    if (!response.snackSalesByCinemaDTOs.length) {
      toast.info("No se registraron ventas de snacks en ese periodo.");
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
    const blob = await snackSalesByCinemaReportPdf(form.cinemaId, query);
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
