<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-7xl mx-auto mb-6" role="banner">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/cines">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al listado de cines" />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Salas del cine
            </h1>
            <p class="text-sm text-slate-600" aria-live="polite">
              {{ cinemaTitle }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            icon="pi pi-refresh"
            label="Recargar"
            size="small"
            severity="secondary"
            text
            :loading="hallsLoading"
            @click="() => refetchHalls()"
          />
          <RouterLink :to="`/admin/cines/sala/cine/crear?cineId=${cinemaId}`">
            <Button icon="pi pi-plus" label="Nueva sala" rounded raised aria-label="Registrar sala" />
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto" role="main">
      <div class="rounded-xl border border-slate-200 bg-white">
        <DataTable
          :value="halls"
          dataKey="id"
          tableStyle="min-width: 60rem"
          stripedRows
          rowHover
          :loading="hallsLoading"
          :paginator="halls.length > 10"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
        >
          <template #empty>
            <div class="py-10 text-center text-slate-600">
              <i class="pi pi-inbox text-3xl mb-2 text-slate-400" aria-hidden="true"></i>
              <div>{{ emptyMessage }}</div>
            </div>
          </template>

          <template #loading>
            <div class="py-10 text-center text-slate-600">
              Cargando salas…
            </div>
          </template>

          <Column field="name" header="Nombre" sortable />
          <Column header="Filas">
            <template #body="{ data }">
              {{ data.rows }}
            </template>
          </Column>
          <Column header="Columnas">
            <template #body="{ data }">
              {{ data.columns }}
            </template>
          </Column>
          <Column header="Capacidad">
            <template #body="{ data }">
              {{ data.rows * data.columns }}
            </template>
          </Column>
          <Column header="Comentarios">
            <template #body="{ data }">
              <Tag
                :value="data.acceptComments ? 'Habilitados' : 'Deshabilitados'"
                :severity="data.acceptComments ? 'success' : 'danger'"
                rounded
              />
            </template>
          </Column>
          <Column header="Visible">
            <template #body="{ data }">
              <Tag
                :value="data.visible ? 'Sí' : 'No'"
                :severity="data.visible ? 'success' : 'secondary'"
                rounded
              />
            </template>
          </Column>
          <Column header="Acciones" headerStyle="width:18rem">
            <template #body="{ data }">
              <div class="flex flex-wrap items-center gap-2">
                <RouterLink :to="`/admin/cines/sala/${data.id}`">
                  <Button icon="pi pi-eye" label="Ver" size="small" text />
                </RouterLink>
                <RouterLink :to="`/admin/cines/sala/editar-${data.id}`">
                  <Button icon="pi pi-pencil" label="Editar" size="small" text severity="warning" />
                </RouterLink>
                <Button
                  icon="pi pi-comments"
                  label="Comentarios"
                  size="small"
                  text
                  :loading="actionLoading === `comments-${data.id}`"
                  @click="() => handleToggleComments(data.id)"
                />
                <Button
                  icon="pi pi-eye"
                  :label="data.visible ? 'Ocultar' : 'Mostrar'"
                  size="small"
                  text
                  severity="info"
                  :loading="actionLoading === `visibility-${data.id}`"
                  @click="() => handleToggleVisibility(data.id)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import {
  getCinemaHallsByCinemaId,
  toggleComments,
  toggleVisibility,
  type CinemaHallResponseDTO,
} from '~/lib/api/cinema/hall'
import { useCustomQuery } from '~/composables/useCustomQuery'

const route = useRoute()
const cinemaId = computed(() => String(route.params.idcine ?? ''))

const {
  state: cinemaState,
} = useCustomQuery({
  key: ['cinema-for-halls', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) {
      throw new Error('Identificador del cine no disponible.')
    }
    return getCinemaById(id)
  },
})

const {
  state: hallsState,
  asyncStatus: hallsStatus,
  refetch: refetchHalls,
} = useCustomQuery({
  key: ['cinema-halls', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) {
      throw new Error('Identificador del cine no disponible.')
    }
    return getCinemaHallsByCinemaId(id)
  },
})

const halls = computed<CinemaHallResponseDTO[]>(() => {
  const data = hallsState.value.data as CinemaHallResponseDTO[] | undefined
  return data ?? []
})

const cinemaTitle = computed(() => {
  const stateValue = cinemaState.value
  if (stateValue.status === 'pending') return 'Cargando detalles del cine…'
  if (stateValue.status === 'error') return 'No fue posible cargar la información del cine.'
  const data = stateValue.data as CinemaResponseDTO | undefined
  return data ? `Gestionar salas de ${data.name}` : 'Cine no encontrado.'
})

const hallsLoading = computed(() => hallsStatus.value === 'loading')
const hallsStateStatus = computed(() => hallsState.value.status)
const emptyMessage = computed(() =>
  hallsStateStatus.value === 'error'
    ? 'No fue posible cargar las salas. Intenta recargar.'
    : 'No hay salas registradas para este cine.'
)

const actionLoading = ref<string | null>(null)

async function handleToggleComments(id: string) {
  try {
    actionLoading.value = `comments-${id}`
    await toggleComments(id)
    toast.success('Se actualizó la configuración de comentarios de la sala.')
    await refetchHalls()
  } catch (error: any) {
    const message = error?.data?.message ?? error?.message ?? 'No se pudo actualizar la configuración de comentarios.'
    toast.error(message)
  } finally {
    actionLoading.value = null
  }
}

async function handleToggleVisibility(id: string) {
  try {
    actionLoading.value = `visibility-${id}`
    await toggleVisibility(id)
    toast.success('Se actualizó la visibilidad de la sala.')
    await refetchHalls()
  } catch (error: any) {
    const message = error?.data?.message ?? error?.message ?? 'No se pudo actualizar la visibilidad de la sala.'
    toast.error(message)
  } finally {
    actionLoading.value = null
  }
}
</script>
