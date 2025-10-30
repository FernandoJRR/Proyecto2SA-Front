<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-4xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/cines">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al listado de cines" />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Registrar cine
          </h1>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto" role="main">
      <div class="rounded-2xl border border-slate-200 bg-white shadow">
        <form class="p-6 sm:p-8 space-y-6" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2" for="companyId">
                Compañía *
              </label>
              <Dropdown
                id="companyId"
                v-model="form.companyId"
                :options="companyOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona una compañía"
                class="w-full"
                :loading="companiesStatus === 'loading'"
                :disabled="companiesStatus === 'loading' || !companyOptions.length"
                filter
              />
              <p v-if="companiesStatus !== 'loading' && !companyOptions.length" class="mt-1 text-sm text-amber-600">
                No hay compañías registradas. Crea una compañía antes de continuar.
              </p>
              <p v-if="errors.companyId" class="mt-1 text-sm text-red-600">
                {{ errors.companyId }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2" for="name">
                Nombre del cine *
              </label>
              <InputText
                id="name"
                v-model.trim="form.name"
                class="w-full"
                autocomplete="off"
                placeholder="Ej. Cine Central"
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
                <label class="block text-sm font-medium text-slate-700 mb-2" for="createdAt">
                  Fecha de creación *
                </label>
                <Calendar
                  id="createdAt"
                  v-model="form.createdAt"
                  class="w-full"
                  dateFormat="dd/mm/yy"
                  showIcon
                  :maxDate="new Date()"
                />
                <p v-if="errors.createdAt" class="mt-1 text-sm text-red-600">
                  {{ errors.createdAt }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4">
            <RouterLink to="/admin/cines">
              <Button type="button" label="Cancelar" severity="secondary" outlined />
            </RouterLink>
            <Button type="submit" label="Crear cine" icon="pi pi-save" :loading="submitting" :disabled="!companyOptions.length" />
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import { toast } from 'vue-sonner'
import { createCinema, type CreateCinemaRequest } from '~/lib/api/cinema/cinema'
import { getCompanies, type CompanyResponseDTO } from '~/lib/api/company/company'

const router = useRouter()

const {
  state: companiesState,
  asyncStatus: companiesStatus,
} = useCustomQuery({
  key: ['companies-for-cinemas-create'],
  query: () => getCompanies(),
})

const companyOptions = computed<Array<{ label: string; value: string }>>(() =>
  (companiesState.value.data ?? []).map((company: CompanyResponseDTO) => ({
    label: company.name,
    value: company.id,
  }))
)

const form = reactive<{
  companyId: string
  name: string
  costPerDay: number | null
  createdAt: Date | null
}>({
  companyId: '',
  name: '',
  costPerDay: null,
  createdAt: new Date(),
})

const errors = reactive<Record<keyof typeof form, string | null>>({
  companyId: null,
  name: null,
  costPerDay: null,
  createdAt: null,
})

const submitting = ref(false)

function validate() {
  errors.companyId = form.companyId ? null : 'Selecciona la compañía propietaria.'
  errors.name =
    form.name.trim().length >= 2
      ? null
      : 'El nombre debe tener al menos 2 caracteres.'
  errors.costPerDay =
    form.costPerDay != null && Number(form.costPerDay) >= 0
      ? null
      : 'Ingresa un costo válido.'
  errors.createdAt = form.createdAt ? null : 'Selecciona la fecha de creación.'

  return !errors.companyId && !errors.name && !errors.costPerDay && !errors.createdAt
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true

  try {
    const createdAtDate =
      form.createdAt instanceof Date ? form.createdAt : new Date(form.createdAt ?? '')
    if (Number.isNaN(createdAtDate.getTime())) {
      throw new Error('Selecciona una fecha de creación válida.')
    }

    const payload: CreateCinemaRequest = {
      companyId: form.companyId,
      name: form.name.trim(),
      costPerDay: Number(form.costPerDay),
      createdAt: createdAtDate.toISOString(),
    }

    const created = await createCinema(payload)
    toast.success('Cine registrado correctamente.')
    await router.push(`/admin/cines/${created.id}`)
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? 'No se pudo registrar el cine.'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}
</script>
