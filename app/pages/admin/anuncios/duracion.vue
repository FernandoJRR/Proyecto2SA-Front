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
            Duraciones de anuncios
          </h1>
          <p class="text-slate-600">
            Administra la cantidad de <strong>días</strong> disponibles para la
            duración de anuncios.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <InputText
            v-model.trim="q"
            placeholder="Buscar por días (vacío = todas)…"
            class="w-72"
            @keydown.enter="runSearch"
          />
          <Button
            icon="pi pi-search"
            label="Buscar"
            @click="runSearch"
            :loading="loading"
          />
          <Button
            icon="pi pi-plus"
            label="Nueva"
            class="p-button-success"
            @click="openCreate"
          />
        </div>
      </header>

      <!-- Table -->
      <div class="rounded-xl border border-slate-200 bg-white">
        <DataTable
          :value="rows"
          dataKey="id"
          :loading="loading"
          paginator
          :rows="10"
          :rowsPerPageOptions="[10]"
          tableStyle="min-width: 36rem"
          class="rounded-xl"
          :pt="{ header: { class: 'text-slate-700' } }"
        >
          <template #empty>
            <div class="text-slate-600 py-8 text-center">
              No hay duraciones registradas.
            </div>
          </template>

          <Column field="days" header="Días" sortable />
          <Column field="createdAt" header="Creada">
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>
          <Column header="Acciones" headerStyle="width:14rem">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
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

      <!-- Create/Edit Dialog -->
      <Dialog
        v-model:visible="showDialog"
        modal
        :header="isEditing ? 'Editar duración' : 'Nueva duración'"
        :style="{ width: '28rem' }"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Días *</label
            >
            <InputNumber
              v-model="form.days"
              :min="1"
              :useGrouping="false"
              inputId="days"
              class="w-full"
            />
            <small v-if="errors.days" class="text-red-600">{{
              errors.days
            }}</small>
            <p v-if="isEditing" class="mt-2 text-xs text-slate-500">
              Nota: no existe endpoint de actualización; se recreará el registro
              con el nuevo valor.
            </p>
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button
              label="Cancelar"
              severity="secondary"
              outlined
              @click="closeDialog"
            />
            <Button
              :label="isEditing ? 'Guardar' : 'Crear'"
              :loading="saving"
              @click="save"
            />
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
  create,
  deleteById,
  type DurationDays,
} from "~/lib/api/anuncios/duration";

const confirm = useConfirm();

const q = ref("");
const loading = ref(false);
const all = ref<DurationDays[]>([]);
const rows = ref<DurationDays[]>([]);
const deletingId = ref<string | null>(null);

// Dialog state
const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = reactive<{ days: number | null }>({ days: 7 });
const errors = reactive<{ days: string | null }>({ days: null });

function validateForm() {
  errors.days = form.days && Number(form.days) > 0 ? null : "Requerido";
  return !errors.days;
}

function openCreate() {
  isEditing.value = false;
  editingId.value = null;
  form.days = 7;
  errors.days = null;
  showDialog.value = true;
}

function openEdit(row: DurationDays) {
  isEditing.value = true;
  editingId.value = row.id;
  form.days = row.days;
  errors.days = null;
  showDialog.value = true;
}

function closeDialog() {
  showDialog.value = false;
}

async function runSearch() {
  loading.value = true;
  try {
    all.value = await getAll();
    const term = q.value.trim();
    if (!term) {
      rows.value = all.value;
    } else {
      // permitir coincidencia exacta o parcial con número
      const n = Number(term);
      rows.value = Number.isFinite(n)
        ? all.value.filter((d) => String(d.days).includes(String(n)))
        : all.value;
    }
  } catch (e: any) {
    rows.value = [];
    toast.error(e?.message);
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!validateForm()) return;
  saving.value = true;
  try {
    if (isEditing.value && editingId.value) {
      // No hay UPDATE: recreamos (create) y luego eliminamos el anterior
      const created = await create(Number(form.days));
      try {
        await deleteById(editingId.value);
      } catch (e: any) {
        toast.warning(
          "Se creó el nuevo registro, pero no se pudo eliminar el anterior."
        );
      }
      toast.success(`Duración guardada (${created.days} días)`);
    } else {
      const created = await create(Number(form.days));
      toast.success(`Duración creada (${created.days} días)`);
    }
    showDialog.value = false;
    await runSearch();
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: DurationDays) {
  confirm.require({
    message: `¿Eliminar la duración de ${row.days} días? Esta acción no se puede deshacer.`,
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
    toast.success("Duración eliminada");
    await runSearch();
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    deletingId.value = null;
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
