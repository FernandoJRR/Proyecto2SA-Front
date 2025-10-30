<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-4xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink :to="`/admin/cines/${cinemaId}`">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al detalle del cine" />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Editar cine
          </h1>
        </div>
        <Button
          v-if="status === 'error'"
          icon="pi pi-refresh"
          label="Reintentar"
          size="small"
          severity="secondary"
          text
          @click="refetch"
        />
      </div>
    </header>

    <main class="max-w-4xl mx-auto" role="main">
      <div v-if="status === 'loading' && !cinema" class="py-16 text-center text-slate-600">
        Cargando cine…
      </div>

      <div v-else-if="status === 'error'" class="py-16 text-center text-red-600 space-y-2">
        <p>No se pudo cargar la información del cine.</p>
        <p class="text-sm text-slate-500">Verifica tu conexión o intenta nuevamente.</p>
      </div>

      <div v-else-if="!cinema" class="py-16 text-center text-slate-600">
        No se encontró el cine solicitado.
      </div>

      <div v-else class="rounded-2xl border border-slate-200 bg-white shadow">
        <form class="p-6 sm:p-8 space-y-6" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2" for="name">
                Nombre del cine *
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
                <label class="block text-sm font-medium text-slate-700 mb-2" for="costPerDay">
                  Costo por día (GTQ) *
                </label>
                <InputNumber
                  id="costPerDay"
                  v-model="form.costPerDay"
                  class="w-full"
                  :min="0"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  mode="currency"
                  currency="GTQ"
                />
                <p v-if="errors.costPerDay" class="mt-1 text-sm text-red-600">
                  {{ errors.costPerDay }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2" for="costChangeDate">
                  Fecha de cambio de costo *
                </label>
                <Calendar
                  id="costChangeDate"
                  v-model="form.costChangeDate"
                  class="w-full"
                  dateFormat="dd/mm/yy"
                  showIcon
                />
                <p v-if="errors.costChangeDate" class="mt-1 text-sm text-red-600">
                  {{ errors.costChangeDate }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  Esta fecha indica desde cuándo aplica el nuevo costo diario.
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4">
            <RouterLink :to="`/admin/cines/${cinemaId}`">
              <Button type="button" label="Cancelar" severity="secondary" outlined />
            </RouterLink>
            <Button type="submit" label="Guardar cambios" icon="pi pi-save" :loading="submitting" />
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import { toast } from 'vue-sonner'
import { getCinemaById, updateCinema, type CinemaResponseDTO, type UpdateCinemaRequest } from '~/lib/api/cinema/cinema'

const route = useRoute()
const router = useRouter()

const cinemaId = computed(() => route.params.id as string)

const {
  state,
  asyncStatus: status,
  refetch,
} = useCustomQuery({
  key: ['cinema-edit', () => cinemaId.value],
  query: () => getCinemaById(cinemaId.value),
})

const cinema = computed<CinemaResponseDTO | null>(() => {
  const data = state.value?.data as CinemaResponseDTO | undefined
  return data ?? null
})

const form = reactive<{
  name: string
  costPerDay: number | null
  costChangeDate: Date | null
}>({
  name: '',
  costPerDay: null,
  costChangeDate: new Date(),
})

const errors = reactive<Record<keyof typeof form, string | null>>({
  name: null,
  costPerDay: null,
  costChangeDate: null,
})

const submitting = ref(false)

watch(
  cinema,
  (value) => {
    if (!value) return
    form.name = value.name
    form.costPerDay = value.costPerDay
    // reset costChangeDate to today on load to force explicit selection if needed
    form.costChangeDate = new Date()
  },
  { immediate: true }
)

function validate() {
  errors.name =
    form.name.trim().length >= 2
      ? null
      : 'El nombre debe tener al menos 2 caracteres.'
  errors.costPerDay =
    form.costPerDay != null && Number(form.costPerDay) >= 0
      ? null
      : 'Ingresa un costo válido.'
  errors.costChangeDate = form.costChangeDate
    ? null
    : 'Selecciona la fecha en la que entra en vigor el nuevo costo.'

  return !errors.name && !errors.costPerDay && !errors.costChangeDate
}

async function onSubmit() {
  if (!cinema.value) return
  if (!validate()) return

  submitting.value = true
  try {
    const changeDate =
      form.costChangeDate instanceof Date
        ? form.costChangeDate
        : new Date(form.costChangeDate ?? '')
    if (Number.isNaN(changeDate.getTime())) {
      throw new Error('Selecciona una fecha de cambio válida.')
    }

    const payload: UpdateCinemaRequest = {
      name: form.name.trim(),
      costPerDay: Number(form.costPerDay),
      costChangeDate: changeDate.toISOString(),
    }

    await updateCinema(cinemaId.value, payload)
    toast.success('Cine actualizado correctamente.')
    await router.push(`/admin/cines/${cinemaId.value}`)
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? 'No se pudo actualizar el cine.'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}
</script>
