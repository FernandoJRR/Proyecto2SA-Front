<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <!-- Page Header -->
    <header class="max-w-7xl mx-auto mb-8" role="banner">
      <div
        class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <RouterLink to="/admin" class="inline-block mb-2 sm:mb-0">
            <Button
              size="small"
              icon="pi pi-arrow-left"
              label="Volver"
              class="text-slate-700 hover:text-slate-900 mb-4"
            />
          </RouterLink>
          <h1
            class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
          >
            Reportes
          </h1>
          <p class="text-slate-600">
            Selecciona el reporte que deseas consultar.
          </p>
        </div>
        <div class="w-full sm:w-auto">
          <IconField class="w-full sm:w-80" iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model.trim="q"
              placeholder="Buscar reportes…"
              class="w-full"
              :pt="{ root: { class: 'pl-10' } }"
            />
          </IconField>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto" role="main">
      <div
        class="flex items-center justify-between mb-4 text-sm text-slate-600"
      >
        <div>
          <span class="font-semibold">{{ filteredReports.length }}</span>
          {{ filteredReports.length === 1 ? "reporte" : "reportes" }}
          disponibles
        </div>
      </div>

      <div
        v-if="filteredReports.length"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        <template v-for="report in filteredReports" :key="report.route">
          <MenuShortcutCard
            :menu="report"
            v-if="hasAnyRole(role, report.permitedRoles)"
          />
        </template>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <i class="pi pi-inbox text-4xl mb-3 text-slate-400"></i>
        <h2 class="text-lg font-semibold text-slate-800">
          No hay reportes disponibles
        </h2>
        <p class="text-slate-600">
          Ajusta el término de búsqueda o agrega nuevos reportes.
        </p>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from "vue-router";
import MenuShortcutCard from "~/components/cards/MenuShortcutCard.vue";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { AppRoles, hasAnyRole } from "~/lib/auth/roles";

const authStore = useAuthStore();
const { rol } = storeToRefs(authStore);
const role = rol.value ?? null;

const q = ref("");

const reports = reactive([
  {
    title: "Anuncios Comprados",
    description: "Reporte de anuncios adquiridos por los usuarios",
    route: "/admin/reportes/anuncios-comprados",
    permitedRoles: [AppRoles.ADMIN],
  },
  {
    title: "Ganancias Anunciantes",
    description: "Reporte de ganancias generadas por los anunciantes",
    route: "/admin/reportes/ganancias-anunciantes",
    permitedRoles: [AppRoles.ADMIN],
  },
  {
    title: "Snacks Vendidos por Cine",
    description: "Reporte de snacks vendidos en cada cine",
    route: "/admin/reportes/snacks-vendidos-cine",
    permitedRoles: [AppRoles.ADMIN, AppRoles.CINEMA_ADMIN],
  }
]);

const filteredReports = computed(() => {
  const term = q.value.toLowerCase();
  if (!term) return reports;
  return reports.filter(
    (report) =>
      report.title.toLowerCase().includes(term) ||
      report.description.toLowerCase().includes(term) ||
      report.route.toLowerCase().includes(term)
  );
});
</script>
