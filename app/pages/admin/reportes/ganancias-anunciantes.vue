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
              Reporte de ganancias por anunciante
            </h1>
            <p class="text-slate-600 text-sm">
              Consulta los ingresos generados por cada anunciante en el periodo seleccionado.
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
              Anunciante
            </label>
            <Dropdown
              v-model="form.userId"
              :options="sponsorOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona un anunciante (opcional)"
              class="w-full"
              showClear
              :loading="sponsorsLoading"
              :disabled="sponsorsLoading"
              @show="handleSponsorDropdownOpen"
            />
            <p class="mt-1 text-xs text-slate-500">
              Deja vacío el campo para incluir a todos los anunciantes.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Table -->
    <main class="max-w-7xl mx-auto space-y-4" role="main">
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div>
          Total de registros:
          <span class="font-semibold">{{ rows.length }}</span>
        </div>
        <div>
          Total generado:
          <span class="font-semibold text-slate-900">
            {{ formatCurrency(totalGanancias) }}
          </span>
        </div>
      </div>

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
                Mostrando ganancias por anuncio.
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
          <Column field="type" header="Tipo">
            <template #body="{ data }">
              <Tag :value="addTypeLabel(data.type)" />
            </template>
          </Column>
          <Column field="paidAt" header="Pagado">
            <template #body="{ data }">
              {{ formatDateTime(data.paidAt) }}
            </template>
          </Column>
          <Column field="price" header="Precio">
            <template #body="{ data }">
              {{ formatCurrency(data.price) }}
            </template>
          </Column>
          <Column field="addExpiration" header="Expira">
            <template #body="{ data }">
              {{ formatDateTime(data.addExpiration) }}
            </template>
          </Column>
          <Column field="userFullName" header="Anunciante">
            <template #body="{ data }">
              <span>{{ data.userFullName }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>

    <PdfViewerModal
      v-model="showPdf"
      :blob="pdfBlob"
      title="Reporte de ganancias por anunciante"
      file-name="reporte-ganancias-anunciante.pdf"
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
  gananciasAnunciante,
  gananciasAnunciantePdf,
  type GananciasAnuncianteQuery,
  type GananciasAnuncianteReportDTO,
  type AddGananciasAnuncianteReportLineDTO,
} from "~/lib/api/reportes/reportes";
import { AddType } from "~/lib/api/anuncios/anuncio";
import {
  getSponsoredUsers,
  type UserResponseDTO,
} from "~/lib/api/users/user";

const {
  state: sponsorsState,
  asyncStatus: sponsorsStatus,
  refetch: refetchSponsors,
} = useCustomQuery({
  key: ["sponsored-users"],
  query: () => getSponsoredUsers(),
});

const form = reactive<{
  from: Date | null;
  to: Date | null;
  userId: string | null;
}>({
  from: null,
  to: null,
  userId: null,
});

const errors = reactive<{
  from: string | null;
  to: string | null;
}>({
  from: null,
  to: null,
});

const report = ref<GananciasAnuncianteReportDTO | null>(null);
const loading = ref(false);
const pdfLoading = ref(false);
const pdfBlob = ref<Blob | null>(null);
const showPdf = ref(false);

const sponsorsLoading = computed(() => sponsorsStatus.value === "loading");

const rows = computed<AddGananciasAnuncianteReportLineDTO[]>(() => {
  return report.value?.adds ?? [];
});

const totalGanancias = computed(() => report.value?.totalGanancias ?? 0);

const filtersApplied = computed(() => !!form.from || !!form.to || !!form.userId);

const sponsorOptions = computed(() => {
  const users = sponsorsState.value?.data as UserResponseDTO[] | undefined;
  if (!users?.length) return [];
  return users.map((user) => ({
    value: user.id,
    label:
      `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim() ||
      user.email ||
      user.id,
  }));
});

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

function buildQuery(): GananciasAnuncianteQuery | null {
  if (!validate()) return null;
  return {
    from: toDateString(form.from)!,
    to: toDateString(form.to)!,
    userId: form.userId || undefined,
  };
}

async function runSearch() {
  const query = buildQuery();
  if (!query) return;

  loading.value = true;
  try {
    const response = await gananciasAnunciante(query);
    report.value = response;
    if (!response.adds.length) {
      toast.info("No se encontraron ganancias para los filtros seleccionados.");
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
    const blob = await gananciasAnunciantePdf(query);
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

function addTypeLabel(type: AddType) {
  const map: Record<AddType, string> = {
    [AddType.TEXT_BANNER]: "Texto (Banner)",
    [AddType.MEDIA_VERTICAL]: "Media vertical",
    [AddType.MEDIA_HORIZONTAL]: "Media horizontal",
  };
  return map[type] || type;
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

function toDateString(date: Date | null) {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function handleSponsorDropdownOpen() {
  if (!sponsorOptions.value.length && sponsorsStatus.value !== "loading") {
    refetchSponsors();
  }
}
</script>
