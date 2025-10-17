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
            Categorías
          </h1>
          <p class="text-slate-600">
            Administra las categorías usadas en las películas.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <InputText
            v-model.trim="q"
            placeholder="Buscar por nombre (vacío = todas)…"
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
              No hay categorías.
            </div>
          </template>
          <Column field="name" header="Nombre" sortable />
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
          <Column header="Acciones" headerStyle="width:12rem">
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
        :header="isEditing ? 'Editar categoría' : 'Nueva categoría'"
        :style="{ width: '32rem' }"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Nombre *</label
            >
            <InputText
              v-model.trim="form.name"
              class="w-full"
              placeholder="Ej. Acción"
            />
            <small v-if="errors.name" class="text-red-600">{{
              errors.name
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
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { toast } from "vue-sonner";

import {
  searchCategoriesByName,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryResponseDTO,
  type CreateUpdateCategoryDTO,
} from "~/lib/api/movies/category";

const confirm = useConfirm();

const q = ref("");
const loading = ref(false);
const rows = ref<CategoryResponseDTO[]>([]);
const deletingId = ref<string | null>(null);

// Dialog state
const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = reactive<CreateUpdateCategoryDTO>({ name: "" });
const errors = reactive<{ name: string | null }>({ name: null });

function validateForm() {
  errors.name = form.name.trim() ? null : "Requerido";
  return !errors.name;
}

function openCreate() {
  isEditing.value = false;
  editingId.value = null;
  form.name = "";
  errors.name = null;
  showDialog.value = true;
}

function openEdit(row: CategoryResponseDTO) {
  isEditing.value = true;
  editingId.value = row.id;
  form.name = row.name;
  errors.name = null;
  showDialog.value = true;
}

function closeDialog() {
  showDialog.value = false;
}

async function runSearch() {
  loading.value = true;
  try {
    // Si q es vacío/null, el backend devuelve todas
    rows.value = await searchCategoriesByName(q.value || "");
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
      await updateCategory(editingId.value, { name: form.name });
      toast.success("Categoría actualizada");
    } else {
      await createCategory({ name: form.name });
      toast.success("Categoría creada");
    }
    showDialog.value = false;
    await runSearch();
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: CategoryResponseDTO) {
  confirm.require({
    message: `¿Eliminar la categoría "${row.name}"? Esta acción no se puede deshacer.`,
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
    await deleteCategory(id);
    toast.success("Categoría eliminada");
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
    // Recorta fracción a 3 dígitos (milisegundos). Ej: 2025-10-12T11:24:40.459562 -> 2025-10-12T11:24:40.459
    const fixed = iso.replace(/(\.\d{3})\d+$/, "$1");
    let d = new Date(fixed);
    // Fallback: quitar completamente la parte fraccionaria si aún es inválida
    if (isNaN(d.getTime())) {
      const noFrac = iso.split(".")[0];
      d = new Date(noFrac);
    }
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
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
