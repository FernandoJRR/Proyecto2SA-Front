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
            Clasificaciones
          </h1>
          <p class="text-slate-600">
            Administra las clasificaciones de películas (ej. A, B, C) y su
            descripción.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <InputText
            v-model.trim="q"
            placeholder="Buscar por nombre…"
            class="w-72"
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
              No hay clasificaciones.
            </div>
          </template>

          <Column field="name" header="Nombre" sortable />
          <Column field="description" header="Descripción" />
          <Column field="createdAt" header="Creada">
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>
          <Column field="updatedAt" header="Actualizada">
            <template #body="{ data }">
              {{ formatDate(data.updatedAt) }}
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
        :header="isEditing ? 'Editar clasificación' : 'Nueva clasificación'"
        :style="{ width: '36rem' }"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Nombre *</label
            >
            <InputText
              v-model.trim="form.name"
              class="w-full"
              placeholder="Ej. C"
            />
            <small v-if="errors.name" class="text-red-600">{{
              errors.name
            }}</small>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Descripción *</label
            >
            <Textarea
              v-model.trim="form.description"
              class="w-full"
              rows="3"
              placeholder="Ej. Mayores de 18 años"
            />
            <small v-if="errors.description" class="text-red-600">{{
              errors.description
            }}</small>
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
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { toast } from "vue-sonner";

import {
  getAllClassifications,
  createClassification,
  // Si tu lib incluye updateClassification, descomenta la siguiente línea y el uso en save():
  // updateClassification,
  deleteClassification,
  type ClassificationResponseDTO,
  type CreateClassificationDTO,
} from "~/lib/api/movies/classification";

const confirm = useConfirm();

const q = ref("");
const loading = ref(false);
const all = ref<ClassificationResponseDTO[]>([]);
const rows = ref<ClassificationResponseDTO[]>([]);
const deletingId = ref<string | null>(null);

// Dialog state
const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = reactive<CreateClassificationDTO>({ name: "", description: "" });
const errors = reactive<{ name: string | null; description: string | null }>({
  name: null,
  description: null,
});

function validateForm() {
  errors.name = form.name.trim() ? null : "Requerido";
  errors.description = form.description.trim() ? null : "Requerido";
  return !errors.name && !errors.description;
}

function openCreate() {
  isEditing.value = false;
  editingId.value = null;
  form.name = "";
  form.description = "";
  errors.name = null;
  errors.description = null;
  showDialog.value = true;
}

function openEdit(row: ClassificationResponseDTO) {
  isEditing.value = true;
  editingId.value = row.id;
  form.name = row.name;
  form.description = row.description || "";
  errors.name = null;
  errors.description = null;
  showDialog.value = true;
}

function closeDialog() {
  showDialog.value = false;
}

async function runSearch() {
  loading.value = true;
  try {
    // No hay endpoint de búsqueda; traemos todas y filtramos por nombre en cliente
    all.value = await getAllClassifications();
    const term = q.value.trim().toLowerCase();
    rows.value = term
      ? all.value.filter((c) => c.name.toLowerCase().includes(term))
      : all.value;
  } catch (e: any) {
    rows.value = [];
    toast.error(e?.message);
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  q.value = "";
  runSearch();
}

async function save() {
  if (!validateForm()) return;
  saving.value = true;
  try {
    if (isEditing.value && editingId.value) {
      // Si tienes updateClassification disponible en tu lib, úsalo aquí:
      // await updateClassification(editingId.value, { name: form.name, description: form.description })
      // toast.success('Clasificación actualizada')
      // Fallback temporal si no existe update en la API:
      toast.info(
        "Editar requiere endpoint updateClassification; por ahora solo crear/eliminar."
      );
    } else {
      await createClassification({
        name: form.name,
        description: form.description,
      });
      toast.success("Clasificación creada");
    }
    showDialog.value = false;
    await runSearch();
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: ClassificationResponseDTO) {
  confirm.require({
    message: `¿Eliminar la clasificación "${row.name}"? Esta acción no se puede deshacer.`,
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
    await deleteClassification(id);
    toast.success("Clasificación eliminada");
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
