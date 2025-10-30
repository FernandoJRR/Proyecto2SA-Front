<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-3xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        {{ cinemaId }}
        <div class="flex items-center gap-3">
          <RouterLink :to="`/admin/cines/sala/cine/${cinemaId}`">
            <Button
              icon="pi pi-arrow-left"
              label="Volver"
              size="small"
              aria-label="Volver al listado de salas"
            />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Registrar sala
            </h1>
            <p class="text-sm text-slate-600">
              {{ cinemaTitle }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto" role="main">
      <div class="rounded-2xl border border-slate-200 bg-white shadow">
        <form class="p-6 sm:p-8 space-y-6" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label
                class="block text-sm font-medium text-slate-700 mb-1"
                for="name"
              >
                Nombre de la sala *
              </label>
              <InputText
                id="name"
                v-model.trim="form.name"
                class="w-full"
                placeholder="Ej. Sala VIP"
                autocomplete="off"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                {{ errors.name }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  class="block text-sm font-medium text-slate-700 mb-1"
                  for="rows"
                >
                  Filas *
                </label>
                <InputNumber
                  id="rows"
                  v-model="form.rows"
                  class="w-full"
                  :min="1"
                  :useGrouping="false"
                  showButtons
                />
                <p v-if="errors.rows" class="mt-1 text-sm text-red-600">
                  {{ errors.rows }}
                </p>
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-slate-700 mb-1"
                  for="columns"
                >
                  Columnas *
                </label>
                <InputNumber
                  id="columns"
                  v-model="form.columns"
                  class="w-full"
                  :min="1"
                  :useGrouping="false"
                  showButtons
                />
                <p v-if="errors.columns" class="mt-1 text-sm text-red-600">
                  {{ errors.columns }}
                </p>
              </div>
            </div>

            <div
              class="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600"
            >
              Esta sala se asociará al cine seleccionado y podrás administrar
              comentarios y visibilidad desde el listado.
            </div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <RouterLink :to="`/admin/cines/sala/cine/${cinemaId}`">
              <Button
                type="button"
                label="Cancelar"
                severity="secondary"
                outlined
              />
            </RouterLink>
            <Button
              type="submit"
              label="Crear sala"
              icon="pi pi-save"
              :loading="submitting"
              :disabled="submitting"
            />
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import { toast } from "vue-sonner";
import {
  createCinemaHall,
  type CreateCinemaHallRequest,
} from "~/lib/api/cinema/hall";
import { getCinemaById, type CinemaResponseDTO } from "~/lib/api/cinema/cinema";
import { useCustomQuery } from "~/composables/useCustomQuery";

const route = useRoute();
const router = useRouter();

// The cinema id arrives as a query param (cineId) on the creation route.
const cinemaId = computed(() => {
  const value = route.query.cineId;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
});

const { state: cinemaState } = useCustomQuery({
  key: ["cinema-for-hall-create", () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value;
    if (!id) {
      throw new Error("Identificador del cine no disponible.");
    }
    return getCinemaById(id);
  },
});

const cinemaTitle = computed(() => {
  const stateValue = cinemaState.value;
  if (stateValue.status === "pending") return "Cargando información del cine…";
  if (stateValue.status === "error")
    return "No se pudo cargar la información del cine.";
  const data = stateValue.data as CinemaResponseDTO | undefined;
  return data ? `Cine: ${data.name}` : "Cine no encontrado.";
});

const form = reactive({
  name: "",
  rows: 1,
  columns: 1,
});

const errors = reactive<Record<keyof typeof form, string | null>>({
  name: null,
  rows: null,
  columns: null,
});

const submitting = ref(false);

function validate() {
  errors.name =
    form.name.trim().length >= 2
      ? null
      : "El nombre debe tener al menos 2 caracteres.";
  errors.rows =
    Number.isInteger(form.rows) && form.rows >= 1
      ? null
      : "Ingresa un número de filas válido.";
  errors.columns =
    Number.isInteger(form.columns) && form.columns >= 1
      ? null
      : "Ingresa un número de columnas válido.";

  return !errors.name && !errors.rows && !errors.columns;
}

async function onSubmit() {
  if (!validate()) return;
  const id = cinemaId.value;
  if (!id) {
    toast.error("No se pudo determinar el cine seleccionado.");
    return;
  }

  submitting.value = true;

  try {
    const payload: CreateCinemaHallRequest = {
      cinemaId: id,
      name: form.name.trim(),
      rows: form.rows,
      columns: form.columns,
    };
    await createCinemaHall(payload);
    toast.success("Sala creada correctamente.");
    await router.push(`/admin/cines/sala/cine/${id}`);
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? "No se pudo registrar la sala.";
    toast.error(message);
  } finally {
    submitting.value = false;
  }
}
</script>
