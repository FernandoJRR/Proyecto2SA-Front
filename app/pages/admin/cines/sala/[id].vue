<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-4xl mx-auto mb-6" role="banner">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink :to="backToListUrl">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al listado de salas" />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Detalle de sala
          </h1>
        </div>
        <div v-if="hall" class="flex flex-wrap items-center gap-2">
          <RouterLink :to="`/admin/cines/sala/editar-${hall.id}`">
            <Button icon="pi pi-pencil" label="Editar" rounded />
          </RouterLink>
          <Button
            icon="pi pi-comments"
            :label="hall.acceptComments ? 'Deshabilitar comentarios' : 'Habilitar comentarios'"
            size="small"
            severity="secondary"
            outlined
            :loading="actionLoading === 'comments'"
            @click="handleToggleComments"
          />
          <Button
            icon="pi pi-eye"
            :label="hall.visible ? 'Ocultar sala' : 'Mostrar sala'"
            size="small"
            severity="info"
            outlined
            :loading="actionLoading === 'visibility'"
            @click="handleToggleVisibility"
          />
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto" role="main">
      <div v-if="state.value.status === 'pending'" class="py-16 text-center text-slate-600">
        Cargando sala…
      </div>

      <div v-else-if="state.value.status === 'error'" class="py-16 text-center text-red-600">
        Ocurrió un error al cargar la información de la sala.
      </div>

      <div v-else-if="!hall" class="py-16 text-center text-slate-600">
        No se encontró la sala solicitada.
      </div>

      <div v-else class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8 space-y-6">
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Identificador
            </p>
            <p class="mt-1 font-mono text-sm break-all">{{ hall.id }}</p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Nombre
            </p>
            <p class="mt-1 text-base font-semibold text-slate-900">
              {{ hall.name }}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Cine
            </p>
            <p class="mt-1 text-base text-slate-800">
              <RouterLink v-if="hall.cinema?.id" :to="`/admin/cines/${hall.cinema.id}`" class="text-primary-600 hover:underline">
                {{ hall.cinema?.name ?? '—' }}
              </RouterLink>
              <span v-else>{{ hall.cinema?.name ?? '—' }}</span>
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Capacidad
            </p>
            <p class="mt-1 text-base text-slate-800">
              {{ hall.rows * hall.columns }} asientos ({{ hall.rows }} filas × {{ hall.columns }} columnas)
            </p>
          </div>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Comentarios
            </p>
            <Tag
              class="mt-2"
              :value="hall.acceptComments ? 'Habilitados' : 'Deshabilitados'"
              :severity="hall.acceptComments ? 'success' : 'danger'"
              rounded
            />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Visible al público
            </p>
            <Tag
              class="mt-2"
              :value="hall.visible ? 'Sí' : 'No'"
              :severity="hall.visible ? 'success' : 'secondary'"
              rounded
            />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { toast } from 'vue-sonner'
import { getCinemaHallById, toggleComments, toggleVisibility, type CinemaHallResponseDTO } from '~/lib/api/cinema/hall'
import { useCustomQuery } from '~/composables/useCustomQuery'

const route = useRoute()
const hallId = computed(() => String(route.params.id ?? ''))

const {
  state,
  refetch,
} = useCustomQuery({
  key: ['cinema-hall-detail', () => hallId.value],
  query: async () => {
    const id = hallId.value
    if (!id) {
      throw new Error('Identificador de sala no disponible.')
    }
    return getCinemaHallById(id)
  },
})

const hall = computed<CinemaHallResponseDTO | null>(() => {
  const data = state.value.data as CinemaHallResponseDTO | undefined
  return data ?? null
})

const backToListUrl = computed(() => {
  const cinemaId = hall.value?.cinema?.id
  return cinemaId ? `/admin/cines/sala/cine/${cinemaId}` : '/admin/cines'
})

const actionLoading = ref<'comments' | 'visibility' | null>(null)

async function handleToggleComments() {
  if (!hall.value) return
  try {
    actionLoading.value = 'comments'
    await toggleComments(hall.value.id)
    toast.success('Se actualizó la configuración de comentarios de la sala.')
    await refetch()
  } catch (error: any) {
    const message = error?.data?.message ?? error?.message ?? 'No se pudo actualizar la configuración de comentarios.'
    toast.error(message)
  } finally {
    actionLoading.value = null
  }
}

async function handleToggleVisibility() {
  if (!hall.value) return
  try {
    actionLoading.value = 'visibility'
    await toggleVisibility(hall.value.id)
    toast.success('Se actualizó la visibilidad de la sala.')
    await refetch()
  } catch (error: any) {
    const message = error?.data?.message ?? error?.message ?? 'No se pudo actualizar la visibilidad de la sala.'
    toast.error(message)
  } finally {
    actionLoading.value = null
  }
}
</script>
