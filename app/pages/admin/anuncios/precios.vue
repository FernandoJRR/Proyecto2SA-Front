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
            Precios por cine
          </h1>
          <p class="text-slate-600">
            Administra los precios de anuncios por <strong>cine</strong>.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <InputText
            v-model.trim="q"
            placeholder="Buscar por Cinema ID (vacío = todos)…"
            class="w-80"
            @keydown.enter="() => runSearch()"
          />
          <Button
            icon="pi pi-search"
            label="Buscar"
            @click="() => runSearch()"
            :loading="loading"
          />
          <Button
            icon="pi pi-filter-slash"
            label="Limpiar"
            severity="secondary"
            outlined
            @click="resetFilters"
          />
          <Button
            icon="pi pi-plus"
            label="Nuevo"
            class="p-button-success"
            @click="openCreate"
          />
        </div>
      </header>

      <!-- Table -->
      <div class="rounded-xl border border-slate-200 bg-white">
        <DataTable
          :value="rows"
          :lazy="true"
          :paginator="true"
          :rows="rowsPerPage"
          :totalRecords="totalRecords"
          @page="onPageChange"
          dataKey="id"
          :loading="loading"
          tableStyle="min-width: 48rem"
          class="rounded-xl"
          :pt="{ header: { class: 'text-slate-700' } }"
        >
          <template #empty>
            <div class="text-slate-600 py-8 text-center">
              No hay precios configurados.
            </div>
          </template>

          <Column field="cinemaId" header="Cinema ID" />
          <Column field="amountTextBanner" header="Text Banner">
            <template #body="{ data }">
              {{ formatMoney(data.amountTextBanner) }}
            </template>
          </Column>
          <Column field="amountMediaVertical" header="Media Vertical">
            <template #body="{ data }">
              {{ formatMoney(data.amountMediaVertical) }}
            </template>
          </Column>
          <Column field="amountMediaHorizontal" header="Media Horizontal">
            <template #body="{ data }">
              {{ formatMoney(data.amountMediaHorizontal) }}
            </template>
          </Column>
          <Column field="createdAt" header="Creado">
            <template #body="{ data }">{{
              formatDate(data.createdAt)
            }}</template>
          </Column>
          <Column field="updatedAt" header="Actualizado">
            <template #body="{ data }">{{
              formatDate(data.updatedAt)
            }}</template>
          </Column>
          <Column header="Acciones" headerStyle="width:16rem">
            <template #body="{ data }">
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  icon="pi pi-pencil"
                  label="Editar"
                  size="small"
                  @click="openEdit(data)"
                />
                <Button
                  icon="pi pi-trash"
                  label="Eliminar"
                  size="small"
                  severity="danger"
                  :loading="deletingId === data.id"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Create Dialog (por cinemaId) -->
      <Dialog
        v-model:visible="showCreate"
        modal
        header="Nuevo registro de precios"
        :style="{ width: '36rem' }"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Cinema ID *</label
            >
            <InputText
              v-model.trim="createCinemaId"
              class="w-full"
              placeholder="UUID del cine"
            />
            <small v-if="createErrors.cinemaId" class="text-red-600">{{
              createErrors.cinemaId
            }}</small>
          </div>
          <p class="text-xs text-slate-500">
            Se creará el registro de precios para este cine con los valores
            actuales por defecto del sistema.
          </p>
        </div>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button
              label="Cancelar"
              severity="secondary"
              outlined
              @click="showCreate = false"
            />
            <Button label="Crear" :loading="savingCreate" @click="saveCreate" />
          </div>
        </template>
      </Dialog>

      <!-- Edit Dialog (actualización de montos) -->
      <Dialog
        v-model:visible="showEdit"
        modal
        header="Editar precios"
        :style="{ width: '40rem' }"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Cinema ID</label
            >
            <InputText v-model="editForm.cinemaId" class="w-full" disabled />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Text Banner *</label
            >
            <InputNumber
              v-model="editForm.amountTextBanner"
              :min="0"
              :step="0.01"
              :useGrouping="false"
              inputId="tb"
              class="w-full"
            />
            <small v-if="editErrors.amountTextBanner" class="text-red-600">{{
              editErrors.amountTextBanner
            }}</small>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Media Vertical *</label
            >
            <InputNumber
              v-model="editForm.amountMediaVertical"
              :min="0"
              :step="0.01"
              :useGrouping="false"
              inputId="mv"
              class="w-full"
            />
            <small v-if="editErrors.amountMediaVertical" class="text-red-600">{{
              editErrors.amountMediaVertical
            }}</small>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Media Horizontal *</label
            >
            <InputNumber
              v-model="editForm.amountMediaHorizontal"
              :min="0"
              :step="0.01"
              :useGrouping="false"
              inputId="mh"
              class="w-full"
            />
            <small
              v-if="editErrors.amountMediaHorizontal"
              class="text-red-600"
              >{{ editErrors.amountMediaHorizontal }}</small
            >
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button
              label="Cancelar"
              severity="secondary"
              outlined
              @click="showEdit = false"
            />
            <Button label="Guardar" :loading="savingEdit" @click="saveEdit" />
          </div>
        </template>
      </Dialog>

      <!-- Delete confirm -->
      <ConfirmDialog />
    </main>
  </div>
</template>

<script lang="ts" setup>
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { toast } from "vue-sonner";

import {
  getAll,
  getByCinemaId,
  createByCinemaId,
  deleteById,
  deleteByCinemaId,
  updateById,
  type Prices,
  type UpdatePrices,
  type PricesPage,
} from "~/lib/api/anuncios/prices";

const confirm = useConfirm();

const q = ref("");
const loading = ref(false);
const rows = ref<Prices[]>([]);
const deletingId = ref<string | null>(null);
const deletingCinemaId = ref<string | null>(null);
const totalRecords = ref(0);
const page = ref(0);
const rowsPerPage = 20;

// Create dialog state
const showCreate = ref(false);
const savingCreate = ref(false);
const createCinemaId = ref("");
const createErrors = reactive<{ cinemaId: string | null }>({ cinemaId: null });

// Edit dialog state
const showEdit = ref(false);
const savingEdit = ref(false);
const editId = ref<string | null>(null);
const editForm = reactive<{
  cinemaId: string;
  amountTextBanner: number | null;
  amountMediaVertical: number | null;
  amountMediaHorizontal: number | null;
}>({
  cinemaId: "",
  amountTextBanner: null,
  amountMediaVertical: null,
  amountMediaHorizontal: null,
});
const editErrors = reactive<{
  amountTextBanner: string | null;
  amountMediaVertical: string | null;
  amountMediaHorizontal: string | null;
}>({
  amountTextBanner: null,
  amountMediaVertical: null,
  amountMediaHorizontal: null,
});

function validateCreate() {
  createErrors.cinemaId = createCinemaId.value.trim() ? null : "Requerido";
  return !createErrors.cinemaId;
}

function validateEdit() {
  editErrors.amountTextBanner =
    editForm.amountTextBanner != null && Number(editForm.amountTextBanner) >= 0
      ? null
      : "Requerido";
  editErrors.amountMediaVertical =
    editForm.amountMediaVertical != null &&
    Number(editForm.amountMediaVertical) >= 0
      ? null
      : "Requerido";
  editErrors.amountMediaHorizontal =
    editForm.amountMediaHorizontal != null &&
    Number(editForm.amountMediaHorizontal) >= 0
      ? null
      : "Requerido";
  return (
    !editErrors.amountTextBanner &&
    !editErrors.amountMediaVertical &&
    !editErrors.amountMediaHorizontal
  );
}

function openCreate() {
  showCreate.value = true;
  createCinemaId.value = "";
  createErrors.cinemaId = null;
}

function openEdit(row: Prices) {
  showEdit.value = true;
  editId.value = row.id;
  editForm.cinemaId = row.cinemaId;
  editForm.amountTextBanner = row.amountTextBanner;
  editForm.amountMediaVertical = row.amountMediaVertical;
  editForm.amountMediaHorizontal = row.amountMediaHorizontal;
  editErrors.amountTextBanner = null;
  editErrors.amountMediaVertical = null;
  editErrors.amountMediaHorizontal = null;
}

async function runSearch(p: number = 0): Promise<void> {
  loading.value = true;
  try {
    const term = q.value.trim();
    if (!term) {
      const res: PricesPage = await getAll();
      rows.value = res.content;
      totalRecords.value = res.totalElements;
    } else {
      const one = await getByCinemaId(term);
      rows.value = one ? [one] : [];
      totalRecords.value = one ? 1 : 0;
    }
    page.value = p;
  } catch (e: any) {
    rows.value = [];
    toast.error(e?.message);
  } finally {
    loading.value = false;
  }
}

function onPageChange(event: any) {
  runSearch(event.page);
}

function resetFilters() {
  q.value = "";
  page.value = 0;
  runSearch(0);
}

async function saveCreate() {
  if (!validateCreate()) return;
  savingCreate.value = true;
  try {
    const created = await createByCinemaId(createCinemaId.value);
    toast.success(`Precios creados para cine ${created.cinemaId}`);
    showCreate.value = false;
    await runSearch();
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    savingCreate.value = false;
  }
}

async function saveEdit() {
  if (!validateEdit() || !editId.value) return;
  savingEdit.value = true;
  try {
    const payload: UpdatePrices = {
      amountTextBanner: Number(editForm.amountTextBanner),
      amountMediaVertical: Number(editForm.amountMediaVertical),
      amountMediaHorizontal: Number(editForm.amountMediaHorizontal),
    };
    const updated = await updateById(editId.value, payload);
    toast.success(`Precios actualizados para cine ${updated.cinemaId}`);
    showEdit.value = false;
    await runSearch();
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    savingEdit.value = false;
  }
}

function confirmDelete(row: Prices) {
  confirm.require({
    message: `¿Eliminar el registro de precios (${row.cinemaId})?`,
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
    await deleteById(id);
    toast.success("Registro eliminado");
    await runSearch(page.value);
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    deletingId.value = null;
  }
}

function confirmDeleteByCinema(row: Prices) {
  confirm.require({
    message: `¿Eliminar todos los precios del cine ${row.cinemaId}?`,
    header: "Eliminar por cine",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancelar",
    acceptLabel: "Eliminar",
    acceptClass: "p-button-danger",
    accept: () => removeByCinema(row.cinemaId),
  });
}

async function removeByCinema(cinemaId: string) {
  try {
    deletingCinemaId.value = cinemaId;
    await deleteByCinemaId(cinemaId);
    toast.success(`Precios del cine ${cinemaId} eliminados`);
    await runSearch(page.value);
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    deletingCinemaId.value = null;
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
  runSearch();
});
</script>

<style scoped>
/* estilos mínimos */
</style>
