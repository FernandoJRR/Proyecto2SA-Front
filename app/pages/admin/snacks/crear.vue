<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-4xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/snacks">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver a listado" />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Crear snack
          </h1>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto" role="main">
      <div class="rounded-2xl border border-slate-200 bg-white shadow">
        <form class="p-6 sm:p-8 space-y-6" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="name">
                Nombre *
              </label>
              <InputText
                id="name"
                v-model.trim="form.name"
                placeholder="Ej. Combo gigante"
                class="w-full"
              />
              <small v-if="errors.name" class="text-red-600">{{ errors.name }}</small>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="price">
                Precio (GTQ) *
              </label>
              <InputNumber
                id="price"
                v-model="form.price"
                class="w-full"
                mode="currency"
                currency="GTQ"
                :min="0"
                :minFractionDigits="2"
                :maxFractionDigits="2"
              />
              <small v-if="errors.price" class="text-red-600">{{ errors.price }}</small>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Cine *
              </label>
              <Dropdown
                v-model="form.cinemaId"
                :options="cinemaOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona un cine"
                class="w-full"
                :loading="cinemasLoading"
                :disabled="cinemasLoading || !cinemaOptions.length"
                filter
              />
              <small v-if="errors.cinemaId" class="text-red-600">{{ errors.cinemaId }}</small>
              <p
                v-if="!cinemaOptions.length && !cinemasLoading"
                class="mt-1 text-xs text-amber-600"
              >
                No hay cines disponibles. Registra un cine antes de crear el snack.
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="urlImage">
                Imagen (URL)
              </label>
              <InputText
                id="urlImage"
                v-model.trim="form.urlImage"
                placeholder="https://..."
                class="w-full"
                @input="onUrlChange"
              />
              <small v-if="errors.urlImage" class="text-red-600">{{ errors.urlImage }}</small>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Imagen (archivo)
            </label>
            <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" />
            <small v-if="errors.imageFile" class="block text-red-600 mt-1">{{ errors.imageFile }}</small>
            <div v-if="previewSrc" class="mt-3 w-40 rounded-lg overflow-hidden border border-slate-200">
              <img :src="previewSrc" alt="Previsualización" class="w-full h-auto object-cover" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <RouterLink to="/admin/snacks">
              <Button type="button" label="Cancelar" severity="secondary" outlined />
            </RouterLink>
            <Button type="submit" label="Crear snack" icon="pi pi-save" :loading="submitting" :disabled="submitting" />
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import { toast } from 'vue-sonner'
import { createSnack, type CreateSnackMultipart } from '~/lib/api/ventas/snacks'
import { getAllCinemas, getCinemasByCompanyId, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { useAuthStore } from '~/stores/auth'
import { useCustomQuery } from '~/composables/useCustomQuery'

const router = useRouter()
const authStore = useAuthStore()
const { companyId, user } = storeToRefs(authStore)

const form = reactive({
  name: '',
  price: null as number | null,
  cinemaId: '' as string | null,
  urlImage: '',
  imageFile: null as File | null,
})

const errors = reactive<Record<keyof typeof form, string | null>>({
  name: null,
  price: null,
  cinemaId: null,
  urlImage: null,
  imageFile: null,
})

const submitting = ref(false)
const previewSrc = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const {
  state: cinemasState,
  asyncStatus: cinemasStatus,
  refetch: refetchCinemas,
} = useCustomQuery({
  key: ['snacks-create-cinemas', companyId.value ?? null],
  query: () => {
    const id = companyId.value?.trim()
    return id ? getCinemasByCompanyId(id) : getAllCinemas()
  },
})

const cinemaOptions = computed<Array<{ label: string; value: string }>>(() =>
  ((cinemasState.value.data ?? []) as CinemaResponseDTO[]).map((cinema) => ({
    label: cinema.name,
    value: cinema.id,
  }))
)

const cinemasLoading = computed(() => cinemasStatus.value === 'loading')

watch(
  cinemaOptions,
  (options) => {
    if (!options.length) {
      form.cinemaId = null
      return
    }
    if (!form.cinemaId || !options.some((opt) => opt.value === form.cinemaId)) {
      form.cinemaId = options[0].value
    }
  },
  { immediate: true }
)

watch(companyId, () => {
  refetchCinemas()
})

function onUrlChange() {
  if (form.urlImage && fileInput.value) {
    fileInput.value.value = ''
    form.imageFile = null
    previewSrc.value = null
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (file && file.size > 5 * 1024 * 1024) {
    toast.error('La imagen no debe exceder los 5 MB')
    form.imageFile = null
    previewSrc.value = null
    input.value = ''
    return
  }
  form.imageFile = file
  if (file) {
    form.urlImage = ''
    const reader = new FileReader()
    reader.onload = () => {
      previewSrc.value = String(reader.result ?? '')
    }
    reader.readAsDataURL(file)
  } else {
    previewSrc.value = null
  }
}

function validate(): boolean {
  errors.name = form.name.trim().length >= 2 ? null : 'El nombre debe tener al menos 2 caracteres.'
  const priceNumber = typeof form.price === 'number' ? form.price : null
  errors.price = priceNumber != null && priceNumber > 0 ? null : 'Ingresa un precio válido.'
  errors.cinemaId = form.cinemaId ? null : 'Selecciona un cine.'

  const hasUrl = !!form.urlImage.trim()
  const hasFile = !!form.imageFile
  if (!hasUrl && !hasFile) {
    errors.urlImage = 'Proporciona una URL o sube una imagen.'
    errors.imageFile = 'Proporciona una URL o sube una imagen.'
  } else {
    errors.urlImage = null
    errors.imageFile = null
  }

  return Object.values(errors).every((value) => !value)
}

async function onSubmit() {
  if (!validate()) return
  if (!form.cinemaId) return

  submitting.value = true
  try {
    const payload: CreateSnackMultipart = {
      name: form.name.trim(),
      price: Number(form.price),
      cinemaId: form.cinemaId,
      urlImage: form.urlImage.trim() || undefined,
      imageFile: form.imageFile,
    }

    await createSnack(payload)
    toast.success('Snack creado correctamente')
    router.push('/admin/snacks')
  } catch (error: any) {
    toast.error(error?.message ?? 'No fue posible crear el snack')
  } finally {
    submitting.value = false
  }
}
</script>
