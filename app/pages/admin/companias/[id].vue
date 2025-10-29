<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <!-- Header -->
    <header class="max-w-4xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/companias">
            <Button
              icon="pi pi-arrow-left"
              label="Volver"
              size="small"
              aria-label="Volver al listado de compañías"
            />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Detalle de compañía
          </h1>
        </div>
        <div v-if="company" class="flex items-center gap-2">
          <RouterLink :to="`/admin/companias/editar-${company.id}`">
            <Button icon="pi pi-pencil" label="Editar" rounded />
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto" role="main">
      <div
        v-if="state.status === 'pending'"
        class="py-16 text-center text-slate-600"
      >
        Cargando compañía…
      </div>

      <div
        v-else-if="state.status === 'error'"
        class="py-16 text-center text-red-600"
      >
        Ocurrió un error al cargar la información de la compañía.
      </div>

      <div
        v-else-if="!company"
        class="py-16 text-center text-slate-600"
      >
        No se encontró la compañía solicitada.
      </div>

      <div
        v-else
        class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8 space-y-6"
      >
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Identificador
            </p>
            <p class="mt-1 font-mono text-sm break-all">{{ company.id }}</p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Nombre
            </p>
            <p class="mt-1 text-base font-semibold text-slate-900">
              {{ company.name }}
            </p>
          </div>

          <div class="sm:col-span-2">
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Dirección
            </p>
            <p class="mt-1 text-base text-slate-800">
              {{ company.address || "—" }}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Teléfono
            </p>
            <p class="mt-1 text-base text-slate-800">
              {{ formatPhone(company.phoneNumber) }}
            </p>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { RouterLink, useRoute } from "vue-router";
import { getCompanyById, type CompanyResponseDTO } from "~/lib/api/company/company";

const route = useRoute();

const { state } = useCustomQuery({
  key: ["company-detail", () => route.params.id as string],
  query: () => getCompanyById(route.params.id as string),
});

const company = computed<CompanyResponseDTO | null>(() => {
  const data = state.value?.data as CompanyResponseDTO | undefined;
  return data ?? null;
});

function formatPhone(value?: string) {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return value;
}
</script>
