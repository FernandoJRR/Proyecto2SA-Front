<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-7xl mx-auto mb-6" role="banner">
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <RouterLink to="/ventas">
            <Button
              icon="pi pi-arrow-left"
              label="Volver"
              size="small"
              aria-label="Volver a selección de cines"
            />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Nueva venta
            </h1>
            <p class="text-sm text-slate-600" aria-live="polite">
              {{ cinemaSubtitle }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto" role="main">
      <div class="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <section class="rounded-2xl border border-slate-200 bg-white shadow">
            <div class="p-6 sm:p-8 border-b border-slate-100">
              <h2 class="text-lg font-semibold text-slate-900">
                Datos del cliente
              </h2>
              <p class="text-sm text-slate-600">
                Ingresa el código del usuario que está realizando la compra.
              </p>
            </div>
            <div class="p-6 sm:p-8 space-y-3">
              <div>
                <label
                  class="block text-sm font-medium text-slate-700 mb-1"
                  for="client-code"
                >
                  Código de usuario *
                </label>
                <InputText
                  id="client-code"
                  v-model.trim="form.clientCode"
                  placeholder="Ej. USR-00123"
                  class="w-full"
                  autocomplete="off"
                  :disabled="submitting"
                />
                <small v-if="errors.clientCode" class="text-red-600">{{
                  errors.clientCode
                }}</small>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white shadow">
            <div class="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">
                  Snacks disponibles
                </h2>
                <p class="text-sm text-slate-600">
                  Define la cantidad de cada snack que deseas incluir en la venta.
                </p>
              </div>
              <Button
                icon="pi pi-refresh"
                severity="secondary"
                text
                rounded
                :loading="snacksLoading"
                @click="() => refetchSnacks()"
                type="button"
                aria-label="Actualizar snacks"
              />
            </div>
            <div class="p-0 sm:p-0">
              <div v-if="snacksLoading" class="py-16 text-center text-slate-600">
                <i class="pi pi-spinner pi-spin text-3xl mb-3" aria-hidden="true"></i>
                <div>Cargando snacks del cine…</div>
              </div>

              <div
                v-else-if="snacks.length"
                class="overflow-x-auto"
              >
                <table class="min-w-full divide-y divide-slate-100">
                  <thead class="bg-slate-50">
                    <tr class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th class="px-6 py-3">Snack</th>
                      <th class="px-6 py-3 text-right">Precio</th>
                      <th class="px-6 py-3 text-right">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-white text-sm">
                    <tr v-for="snack in snacks" :key="snack.id">
                      <td class="px-6 py-4">
                        <div class="font-medium text-slate-900">
                          {{ snack.name }}
                        </div>
                        <div class="text-xs text-slate-500">
                          ID: {{ snack.id }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-right font-semibold text-slate-900">
                        {{ formatCurrency(snack.price) }}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <InputNumber
                          v-model="snackQuantities[snack.id]"
                          :inputId="`snack-qty-${snack.id}`"
                          :min="0"
                          :step="1"
                          :minFractionDigits="0"
                          :maxFractionDigits="0"
                          showButtons
                          buttonLayout="vertical"
                          incrementButtonIcon="pi pi-plus"
                          decrementButtonIcon="pi pi-minus"
                          class="w-24 ml-auto"
                          :disabled="submitting"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-else
                class="py-16 text-center text-slate-600"
              >
                <i class="pi pi-inbox text-3xl mb-3 text-slate-400" aria-hidden="true"></i>
                <div>
                  No se encontraron snacks activos para este cine.
                </div>
              </div>
            </div>
            <p
              v-if="errors.snacks"
              class="px-6 pb-6 sm:pb-8 text-sm text-red-600"
            >
              {{ errors.snacks }}
            </p>
          </section>

          <div class="flex items-center justify-end gap-3">
            <RouterLink to="/ventas">
              <Button
                type="button"
                label="Cancelar"
                severity="secondary"
                outlined
                :disabled="submitting"
              />
            </RouterLink>
            <Button
              type="submit"
              icon="pi pi-save"
              label="Registrar venta"
              :loading="submitting"
              :disabled="submitDisabled"
            />
          </div>
        </form>

        <aside class="rounded-2xl border border-slate-200 bg-white shadow h-fit">
          <div class="p-6 sm:p-8">
            <h2 class="text-lg font-semibold text-slate-900">
              Resumen de la venta
            </h2>
            <p class="text-sm text-slate-600">
              Verifica los artículos seleccionados antes de confirmar.
            </p>
          </div>

          <div class="px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm text-slate-600">
                <span>Código de usuario</span>
                <span class="font-semibold text-slate-900">
                  {{ form.clientCode || "—" }}
                </span>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-slate-800 mb-2">
                  Snacks seleccionados
                </h3>
                <div v-if="selectedSnackDetails.length" class="space-y-2">
                  <div
                    v-for="item in selectedSnackDetails"
                    :key="item.snackId"
                    class="flex items-start justify-between text-sm text-slate-700"
                  >
                    <div class="flex-1 pr-3">
                      <div class="font-medium text-slate-900">
                        {{ item.name }}
                      </div>
                      <div class="text-xs text-slate-500">
                        {{ item.quantity }} × {{ formatCurrency(item.price) }}
                      </div>
                    </div>
                    <div class="font-semibold text-slate-900">
                      {{ formatCurrency(item.lineTotal) }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-slate-500">
                  Aún no has agregado snacks a la venta.
                </div>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-4 space-y-2 text-sm text-slate-600">
              <div class="flex items-center justify-between">
                <span>Total snacks</span>
                <span class="font-semibold text-slate-900">
                  {{ formatCurrency(snacksTotal) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Total a pagar</span>
                <span>{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import { toast } from "vue-sonner";
import {
  getCinemaById,
  type CinemaResponseDTO,
} from "~/lib/api/cinema/cinema";
import {
  searchSnacksByCinema,
  type SnackPage,
  type SnackView,
} from "~/lib/api/ventas/snacks";
import { createSale } from "~/lib/api/ventas/sales";
import { useCustomQuery } from "~/composables/useCustomQuery";

const route = useRoute();
const cinemaId = computed(() => String(route.params.id ?? ""));

const {
  state: cinemaState,
  asyncStatus: cinemaStatus,
} = useCustomQuery({
  key: ["venta-cinema", () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value;
    if (!id) {
      throw new Error("Identificador de cine no disponible.");
    }
    return getCinemaById(id);
  },
});

const cinema = computed<CinemaResponseDTO | null>(() => {
  const data = cinemaState.value.data as CinemaResponseDTO | undefined;
  return data ?? null;
});

const cinemaSubtitle = computed(() => {
  if (cinemaStatus.value === "loading") {
    return "Cargando información del cine…";
  }
  if (!cinema.value) {
    return "Cine no disponible";
  }
  const companyName = cinema.value.company?.name
    ? ` · ${cinema.value.company.name}`
    : "";
  return `${cinema.value.name}${companyName}`;
});

const {
  state: snacksState,
  asyncStatus: snacksStatus,
  refetch: refetchSnacks,
} = useCustomQuery({
  key: ["venta-snacks", () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value;
    if (!id) {
      throw new Error("Identificador de cine no disponible.");
    }
    return searchSnacksByCinema(id, 0, { active: true });
  },
});

const snacksPage = computed<SnackPage | null>(() => {
  const data = snacksState.value.data as SnackPage | undefined;
  return data ?? null;
});

const snacks = computed<SnackView[]>(() => snacksPage.value?.content ?? []);
const snacksLoading = computed(() => snacksStatus.value === "loading");

const snackQuantities = reactive<Record<string, number>>({});

watch(
  snacks,
  (items) => {
    const currentKeys = new Set(Object.keys(snackQuantities));
    for (const snack of items) {
      if (typeof snackQuantities[snack.id] !== "number") {
        snackQuantities[snack.id] = 0;
      }
      currentKeys.delete(snack.id);
    }
    for (const key of currentKeys) {
      delete snackQuantities[key];
    }
  },
  { immediate: true }
);

const form = reactive({
  clientCode: "",
});

const errors = reactive({
  clientCode: null as string | null,
  snacks: null as string | null,
});

const submitting = ref(false);

const snacksMap = computed<Record<string, SnackView>>(() => {
  const map: Record<string, SnackView> = {};
  for (const snack of snacks.value) {
    map[snack.id] = snack;
  }
  return map;
});

const selectedSnacks = computed(() =>
  Object.entries(snackQuantities)
    .filter(([, quantity]) => typeof quantity === "number" && quantity > 0)
    .map(([snackId, quantity]) => ({
      snackId,
      quantity,
    }))
);

const selectedSnackDetails = computed(() =>
  selectedSnacks.value.map((item) => {
    const snack = snacksMap.value[item.snackId];
    const price = snack?.price ?? 0;
    return {
      ...item,
      name: snack?.name ?? "Snack",
      price,
      lineTotal: price * item.quantity,
    };
  })
);

const snacksTotal = computed(() =>
  selectedSnackDetails.value.reduce((total, item) => total + item.lineTotal, 0)
);

const grandTotal = computed(() => snacksTotal.value);

const submitDisabled = computed(() => {
  if (submitting.value) return true;
  if (!form.clientCode.trim()) return true;
  if (!selectedSnacks.value.length) return true;
  return false;
});

watch(
  () => form.clientCode,
  () => {
    errors.clientCode = null;
  }
);

watch(
  selectedSnacks,
  () => {
    errors.snacks = null;
  }
);

function resetForm() {
  form.clientCode = "";
  for (const key of Object.keys(snackQuantities)) {
    snackQuantities[key] = 0;
  }
}

async function handleSubmit() {
  errors.clientCode = form.clientCode.trim()
    ? null
    : "El código de usuario es obligatorio.";
  errors.snacks = selectedSnacks.value.length
    ? null
    : "Selecciona al menos un snack para la venta.";

  if (errors.clientCode || errors.snacks) {
    toast.error("Revisa los campos obligatorios antes de continuar.");
    return;
  }

  const cinema = cinemaId.value;
  if (!cinema) {
    toast.error("No se pudo identificar el cine de la venta.");
    return;
  }

  submitting.value = true;
  try {
    await createSale({
      clientId: form.clientCode.trim(),
      cinemaId: cinema,
      snacks: selectedSnacks.value.map((item) => ({
        snackId: item.snackId,
        quantity: item.quantity,
      })),
      tickets: [],
    });

    toast.success("La venta se registró correctamente.");
    resetForm();
  } catch (error: any) {
    const message =
      error?.data?.message ??
      error?.message ??
      "No se pudo registrar la venta. Intenta nuevamente.";
    toast.error(message);
  } finally {
    submitting.value = false;
  }
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Q0.00";
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(value);
}
</script>
