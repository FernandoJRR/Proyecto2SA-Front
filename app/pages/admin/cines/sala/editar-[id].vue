<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-3xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink :to="backToListUrl">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al listado de salas" />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Editar sala
            </h1>
            <p class="text-sm text-slate-600">
              {{ cinemaTitle }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto" role="main">
      <div v-if="queryStatus === 'pending'" class="py-16 text-center text-slate-600">
        Cargando sala…
      </div>
      <div v-else-if="queryStatus === 'error'" class="py-16 text-center text-red-600">
        No fue posible cargar la información de la sala.
      </div>
      <div v-else-if="!hall" class="py-16 text-center text-slate-600">
        No se encontró la sala solicitada.
      </div>
      <div v-else class="rounded-2xl border border-slate-200 bg-white shadow">
        <form class="p-6 sm:p-8 space-y-6" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="name">
                Nombre de la sala *
              </label>
              <InputText
                id="name"
                v-model.trim="form.name"
                class="w-full"
                autocomplete="off"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                {{ errors.name }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="rows">
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
                <label class="block text-sm font-medium text-slate-700 mb-1" for="columns">
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

            <div class="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 space-y-2">
              <p>
                Capacidad total: <span class="font-semibold text-slate-800">{{ capacity }} asientos</span>
              </p>
              <p>
                Comentarios: <span class="font-semibold text-slate-800">{{ hall.acceptComments ? 'Habilitados' : 'Deshabilitados' }}</span>
              </p>
              <p>
                Visible al público: <span class="font-semibold text-slate-800">{{ hall.visible ? 'Sí' : 'No' }}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <RouterLink :to="backToListUrl">
              <Button type="button" label="Cancelar" severity="secondary" outlined />
            </RouterLink>
            <Button type="submit" label="Guardar cambios" icon="pi pi-save" :loading="submitting" :disabled="submitting" />
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import { toast } from 'vue-sonner'
import { getCinemaHallById, updateCinemaHall, type CinemaHallResponseDTO, type UpdateCinemaHallRequest } from '~/lib/api/cinema/hall'
import { useCustomQuery } from '~/composables/useCustomQuery'

const route = useRoute()
const router = useRouter()

const hallId = computed(() => String(route.params.id ?? ''))

const { state, refetch } = useCustomQuery({
  key: ['cinema-hall-edit', () => hallId.value],
  query: async () => {
    const id = hallId.value
    if (!id) {
      throw new Error('Identificador de sala no disponible.')
    }
    return getCinemaHallById(id)
  },
})

const queryStatus = computed(() => state.value?.status ?? 'pending')

const hall = computed<CinemaHallResponseDTO | null>(() => {
  const data = state.value?.data as CinemaHallResponseDTO | undefined
  return data ?? null
})

const cinemaTitle = computed(() => {
  if (queryStatus.value === 'pending') return 'Cargando información del cine…'
  if (queryStatus.value === 'error') return 'No se pudo cargar la información del cine.'
  return hall.value?.cinema?.name ? `Cine: ${hall.value.cinema.name}` : 'Cine no disponible.'
})

const backToListUrl = computed(() => {
  const cinemaId = hall.value?.cinema?.id
  return cinemaId ? `/admin/cines/sala/cine/${cinemaId}` : '/admin/cines'
})

const form = reactive({
  name: '',
  rows: 1,
  columns: 1,
})

const errors = reactive<Record<keyof typeof form, string | null>>({
  name: null,
  rows: null,
  columns: null,
})

const submitting = ref(false)

watch(
  hall,
  (value) => {
    if (!value) return
    form.name = value.name
    form.rows = value.rows
    form.columns = value.columns
  },
  { immediate: true }
)

const capacity = computed(() => form.rows * form.columns)

function validate() {
  errors.name =
    form.name.trim().length >= 2
      ? null
      : 'El nombre debe tener al menos 2 caracteres.'
  errors.rows =
    Number.isInteger(form.rows) && form.rows >= 1
      ? null
      : 'Ingresa un número de filas válido.'
  errors.columns =
    Number.isInteger(form.columns) && form.columns >= 1
      ? null
      : 'Ingresa un número de columnas válido.'

  return !errors.name && !errors.rows && !errors.columns
}

async function onSubmit() {
  if (!validate()) return
  const id = hallId.value
  if (!id) {
    toast.error('No se encontró la sala a actualizar.')
    return
  }

  submitting.value = true

  try {
    const payload: UpdateCinemaHallRequest = {
      name: form.name.trim(),
      rows: form.rows,
      columns: form.columns,
    }
    await updateCinemaHall(id, payload)
    toast.success('Sala actualizada correctamente.')
    await refetch()
    await router.push(backToListUrl.value)
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? 'No se pudieron guardar los cambios.'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}
</script>
