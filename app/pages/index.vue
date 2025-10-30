<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-7xl mx-auto mb-8">
      <div
        class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1
            class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
          >
            Cines disponibles
          </h1>
          <p class="text-slate-600">
            Consulta la lista de cines registrados en la plataforma.
          </p>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto" role="main">
      <div
        class="flex items-center justify-between mb-4 text-sm text-slate-600"
      >
        <div v-if="!loading">
          <span class="font-semibold">{{ cinemas.length }}</span>
          {{ cinemas.length === 1 ? "cine disponible" : "cines disponibles" }}
        </div>
        <div v-else class="text-slate-500">Cargando cines…</div>
      </div>

      <div v-if="loading" class="py-20 text-center text-slate-600">
        <i class="pi pi-spinner pi-spin text-3xl mb-4" aria-hidden="true"></i>
        <p>Estamos cargando la información de los cines.</p>
      </div>

      <div
        v-else-if="cinemas.length"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <section
          v-for="cinema in cinemas"
          :key="cinema.id"
          class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="p-5 border-b border-slate-100">
            <h2 class="text-lg font-semibold text-slate-900">
              {{ cinema.name }}
            </h2>
          </div>
          <div class="p-5 space-y-3 text-sm text-slate-600">
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-700">Telefono</span>
              <span class="text-slate-800 font-semibold">{{
                cinema.company.phoneNumber
              }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-700">Desde</span>
              <span>{{ formatDate(cinema.createdAt) }}</span>
            </div>
          </div>
        </section>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-20 text-center text-slate-600"
      >
        <i
          class="pi pi-inbox text-4xl mb-3 text-slate-400"
          aria-hidden="true"
        ></i>
        <h2 class="text-lg font-semibold text-slate-800">
          No hay cines registrados.
        </h2>
        <p>Pronto encontrarás nuevos cines disponibles.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getAllCinemas, type CinemaResponseDTO } from "~/lib/api/cinema/cinema";

const { state, asyncStatus: status } = useCustomQuery({
  key: ["public-cinemas"],
  query: () => getAllCinemas(),
});

const cinemas = computed<CinemaResponseDTO[]>(() => state.value.data ?? []);
const loading = computed(() => status.value === "loading");

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-GT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
</script>
