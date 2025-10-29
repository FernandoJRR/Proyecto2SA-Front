<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <!-- Header -->
    <header class="max-w-7xl mx-auto mb-6" role="banner">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <RouterLink to="/admin">
            <Button
              icon="pi pi-arrow-left"
              label="Volver"
              size="small"
              aria-label="Volver a Administración"
            />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Compañías
          </h1>
        </div>
        <RouterLink to="/admin/companias/crear">
          <Button
            icon="pi pi-plus"
            label="Nueva compañía"
            rounded
            raised
            aria-label="Crear nueva compañía"
          />
        </RouterLink>
      </div>
    </header>

    <!-- Table -->
    <main class="max-w-7xl mx-auto" role="main">
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <DataTable
          :value="companies"
          dataKey="id"
          tableStyle="min-width: 56rem"
          stripedRows
          rowHover
          :loading="status === 'loading'"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm text-slate-600"
                >Total:
                <span class="font-semibold">{{ companies.length }}</span></span
              >
              <Button
                icon="pi pi-refresh"
                label="Recargar"
                size="small"
                severity="secondary"
                text
                :loading="status === 'loading'"
                @click="() => refetch()"
              />
            </div>
          </template>

          <Column field="name" header="Nombre" sortable />
          <Column field="address" header="Dirección">
            <template #body="{ data }">
              <span class="block max-w-xs truncate" :title="data.address">
                {{ data.address || "—" }}
              </span>
            </template>
          </Column>
          <Column field="phoneNumber" header="Teléfono">
            <template #body="{ data }">
              {{ formatPhone(data.phoneNumber) }}
            </template>
          </Column>
          <Column header="Acciones" headerStyle="width:14rem">
            <template #body="{ data }">
              <div class="flex flex-wrap items-center gap-1">
                <RouterLink :to="`/admin/companias/${data.id}`">
                  <Button
                    label="Ver"
                    severity="info"
                    variant="text"
                    rounded
                    aria-label="Ver compañía"
                  />
                </RouterLink>
                <RouterLink :to="`/admin/companias/editar-${data.id}`">
                  <Button
                    label="Editar"
                    severity="warn"
                    variant="text"
                    rounded
                    aria-label="Editar compañía"
                  />
                </RouterLink>
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="py-10 text-center text-slate-600">
              <i
                class="pi pi-inbox text-3xl mb-2 text-slate-400"
                aria-hidden="true"
              ></i>
              <div>No hay compañías registradas.</div>
            </div>
          </template>

          <template #loading>
            <div class="py-10 text-center text-slate-600">
              Cargando compañías…
            </div>
          </template>

          <template #footer>
            Hay en total {{ companies.length }} compañías.
          </template>
        </DataTable>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from "vue-router";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import {
  getCompanies,
  type CompanyResponseDTO,
} from "~/lib/api/company/company";

const {
  state,
  asyncStatus: status,
  refetch,
} = useCustomQuery({
  key: ["companies-index"],
  query: () => getCompanies(),
});

const companies = computed<CompanyResponseDTO[]>(() => state.value.data ?? []);

function formatPhone(value?: string) {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return value;
}
</script>
