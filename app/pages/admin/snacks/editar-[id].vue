<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-4xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink :to="`/admin/snacks/${snackId}`">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al detalle" />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Editar snack
          </h1>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto" role="main">
      <div v-if="state.status === 'pending'" class="py-16 text-center text-slate-600">
        Cargando snack…
      </div>
      <div v-else-if="state.status === 'error'" class="py-16 text-center text-red-600">
        No fue posible cargar la información del snack.
      </div>
      <div v-else-if="!snack" class="py-16 text-center text-slate-600">
        No se encontró el snack solicitado.
      </div>
      <div v-else-if="!isAllowed" class="py-16 text-center text-amber-600">
        No tienes permiso para editar este snack.
      </div>
      <div v-else class="rounded-2xl border border-slate-200 bg-white shadow">
        <form class="p-6 sm:p-8 space-y-6" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="name">
                Nombre *
              </label>
              <InputText
                id="name"
                v-model.trim="form.name"
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
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p class="block text-sm font-medium text-slate-700 mb-1">
                Cine
              </p>
              <p class="text-slate-800 font-semibold">
                {{ resolveCinemaName(snack.cinemaId) }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                El cine no puede cambiarse al editar.
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="urlImage">
                Imagen (URL)
              </label>
              <div v-if="!hasFile">
                <InputText
                  id="urlImage"
                  v-model.trim="form.urlImage"
                  placeholder="https://..."
                  class="w-full"
                  @input="onUrlChange"
                />
                <small v-if="errors.urlImage" class="text-red-600">{{ errors.urlImage }}</small>
              </div>
              <p v-else class="text-xs text-slate-500">
                Para usar una URL elimina el archivo seleccionado.
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Imagen (archivo)
            </label>
            <div v-if="!hasUrl">
              <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" />
              <small v-if="errors.imageFile" class="block text-red-600 mt-1">{{ errors.imageFile }}</small>
            </div>
            <p v-else class="text-xs text-slate-500">
              Para subir un archivo elimina la URL establecida.
            </p>
          </div>

          <div v-if="previewSrc" class="w-40 rounded-lg overflow-hidden border border-slate-200">
            <img :src="previewSrc" alt="Previsualización" class="w-full h-auto object-cover" />
          </div>

          <div class="flex items-center justify-end gap-3">
            <RouterLink :to="`/admin/snacks/${snackId}`">
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
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import { toast } from 'vue-sonner'
import { getSnackById, updateSnack, type SnackResponseDTO, type UpdateSnackMultipart } from '~/lib/api/ventas/snacks'
import { getAllCinemas, getCinemasByCompanyId, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { useAuthStore } from '~/stores/auth'
import { useCustomQuery } from '~/composables/useCustomQuery'

const route = useRoute()
const router = useRouter()
const snackId = route.params.id as string

const authStore = useAuthStore()
const { companyId } = storeToRefs(authStore)

const {
  state,
  refetch,
} = useCustomQuery({
  key: ['snack-edit', snackId],
  query: () => getSnackById(snackId),
})

const {
  state: cinemasState,
  refetch: refetchCinemas,
} = useCustomQuery({
  key: ['snacks-edit-cinemas', companyId.value ?? null],
  query: () => {
    const id = companyId.value?.trim()
    return id ? getCinemasByCompanyId(id) : getAllCinemas()
  },
})

const snack = computed<SnackResponseDTO | null>(() => {
  const data = state.value.data as SnackResponseDTO | undefined
  return data ?? null
})

const cinemaOptions = computed<CinemaResponseDTO[]>(() => (cinemasState.value.data ?? []) as CinemaResponseDTO[])
const cinemaNameMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  cinemaOptions.value.forEach((cinema) => {
    map[cinema.id] = cinema.name
  })
  return map
})

const isAllowed = computed(() => {
  if (!companyId.value) return true
  if (!snack.value) return false
  return cinemaOptions.value.some((cinema) => cinema.id === snack.value?.cinemaId)
})

watch(companyId, () => {
  refetchCinemas()
})

const form = reactive({
  name: '',
  price: null as number | null,
  urlImage: '',
  imageFile: null as File | null,
})

const errors = reactive<Record<keyof typeof form, string | null>>({
  name: null,
  price: null,
  urlImage: null,
  imageFile: null,
})

const submitting = ref(false)
const previewSrc = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const hasUrl = computed(() => form.urlImage.trim().length > 0)
const hasFile = computed(() => !!form.imageFile)

watch(
  snack,
  (value) => {
    if (!value) return
    form.name = value.name
    form.price = Number(value.price)
    form.urlImage = value.imageUrl ?? ''
    previewSrc.value = value.imageUrl ?? null
    form.imageFile = null
    if (fileInput.value) fileInput.value.value = ''
  },
  { immediate: true }
)

function resolveCinemaName(id?: string | null) {
  if (!id) return '—'
  return cinemaNameMap.value[id] ?? id
}

function onUrlChange() {
  if (form.urlImage && fileInput.value) {
    fileInput.value.value = ''
    form.imageFile = null
    previewSrc.value = form.urlImage || null
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (file && file.size > 5 * 1024 * 1024) {
    toast.error('La imagen no debe exceder los 5 MB')
    form.imageFile = null
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
    previewSrc.value = snack.value?.imageUrl ?? null
  }
}

function validate(): boolean {
  errors.name = form.name.trim().length >= 2 ? null : 'El nombre debe tener al menos 2 caracteres.'
  const priceNumber = typeof form.price === 'number' ? form.price : null
  errors.price = priceNumber != null && priceNumber > 0 ? null : 'Ingresa un precio válido.'

  if (!hasUrl.value && !hasFile.value && !snack.value?.imageUrl) {
    errors.urlImage = 'Proporciona una URL o sube una imagen.'
    errors.imageFile = 'Proporciona una URL o sube una imagen.'
  } else {
    errors.urlImage = null
    errors.imageFile = null
  }

  return Object.values(errors).every((value) => !value)
}

async function onSubmit() {
  if (!snack.value) return
  if (!isAllowed.value) {
    toast.error('No tienes permiso para editar este snack.')
    return
  }
  if (!validate()) return

  submitting.value = true
  try {
    const payload: UpdateSnackMultipart = {
      name: form.name.trim(),
      price: Number(form.price),
      urlImage: form.urlImage.trim() || undefined,
      file: form.imageFile,
    }

    await updateSnack(snack.value.id, payload)
    toast.success('Snack actualizado correctamente')
    await refetch()
    router.push(`/admin/snacks/${snack.value.id}`)
  } catch (error: any) {
    toast.error(error?.message ?? 'No fue posible actualizar el snack')
  } finally {
    submitting.value = false
  }
}
</script>
