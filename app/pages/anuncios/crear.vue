<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
    <main class="max-w-3xl mx-auto">
      <header class="mb-6">
        <h1
          class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
        >
          Crear anuncio
        </h1>
        <p class="text-slate-600">
          Completa la información y sube el archivo del anuncio. Los campos
          marcados con * son obligatorios.
        </p>
      </header>

      <div class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <form @submit.prevent="onSubmit" novalidate>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <!-- Descripción -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Descripción *</label
              >
              <Textarea
                v-model.trim="form.description"
                rows="3"
                class="w-full"
                placeholder="Ej. Trailer final de John Wick"
              />
              <small v-if="errors.description" class="text-red-600">{{
                errors.description
              }}</small>
            </div>

            <!-- Contenido (solo para Texto/Banner) -->
            <div class="sm:col-span-2" v-if="isText">
              <label class="block text-sm font-medium text-slate-700 mb-1">Contenido del banner *</label>
              <Textarea v-model.trim="form.content" rows="3" class="w-full" placeholder="Texto del banner (máx. 280 caracteres)" />
              <small v-if="errors.content" class="text-red-600">{{ errors.content }}</small>
            </div>

            <!-- Tipo -->
            <div v-if="form.cinemaId">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Tipo *</label
              >
              <Dropdown
                v-model="form.type"
                :options="typeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona tipo"
                class="w-full"
              />
              <small v-if="errors.type" class="text-red-600">{{
                errors.type
              }}</small>
              <p v-if="form.type" class="mt-1 text-sm text-slate-600">
                Valor por día (según cine seleccionado):
                <span class="font-semibold text-slate-800">{{ selectedPrice }}</span>
              </p>
            </div>

            <!-- Cinema -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Cinema ID *</label
              >
              <InputText
                v-model.trim="form.cinemaId"
                placeholder="UUID del cine"
                class="w-full"
              />
              <small v-if="errors.cinemaId" class="text-red-600">{{
                errors.cinemaId
              }}</small>
            </div>

            <!-- URL de contenido (solo media; alterna con archivo) -->
            <div class="sm:col-span-2" v-if="showUrlInput">
              <label class="block text-sm font-medium text-slate-700 mb-1">URL del contenido</label>
              <InputText v-model.trim="form.urlContent" placeholder="https://youtu.be/..." class="w-full" />
              <small v-if="errors.urlContent" class="text-red-600">{{ errors.urlContent }}</small>
              <p class="text-xs text-slate-500 mt-1">Para media puedes enviar <strong>URL</strong> o <strong>archivo</strong>, no ambos.</p>
            </div>

            <!-- Duración en días -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Duración (días) *</label
              >
              <Dropdown
                v-model="form.durationDaysId"
                :options="durations"
                optionLabel="days"
                optionValue="id"
                placeholder="Selecciona duración"
                class="w-full"
              />
              <small v-if="errors.durationDaysId" class="text-red-600">{{
                errors.durationDaysId
              }}</small>
            </div>

            <!-- Archivo (solo media; alterna con URL) -->
            <div class="sm:col-span-2" v-if="showFileInput">
              <label class="block text-sm font-medium text-slate-700 mb-1">Archivo (máx 20 MB)</label>
              <input ref="fileInput" type="file" @change="onFileChange" />
              <small v-if="errors.file" class="block text-red-600 mt-1">{{ errors.file }}</small>
              <div v-if="previewSrc" class="mt-3 w-48 rounded-lg overflow-hidden border border-slate-200">
                <img :src="previewSrc" alt="Previsualización" class="w-full h-auto object-cover" />
              </div>
            </div>

            <!-- Precio calculado -->
            <div class="sm:col-span-2">
              <p class="text-slate-700 font-medium">
                Precio total estimado:
                <span class="font-semibold text-emerald-700">{{
                  totalPriceFormatted
                }}</span>
              </p>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" :loading="loading" :disabled="loading">
              <span v-if="!loading">Crear</span>
              <span v-else>Guardando…</span>
            </Button>
            <Button severity="secondary" outlined @click="goList" type="button"
              >Cancelar</Button
            >
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Dropdown from "primevue/dropdown";
import { toast } from "vue-sonner";
import {
  AddType,
  createAnuncio,
  type CreateAnuncioMultipart,
} from "~/lib/api/anuncios/anuncio";
import { getAll as getDurations } from "~/lib/api/anuncios/duration";
import { getByCinemaId as getPricesByCinemaId, type Prices } from "~/lib/api/anuncios/prices";

const authStore = useAuthStore();
const { user, rol: currentUserRole } = storeToRefs(authStore);

const router = useRouter();
const loading = ref(false);
const previewSrc = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const form = reactive({
  description: "",
  content: "",
  type: null as AddType | null,
  cinemaId: "",
  userId: user.value?.userId,
  urlContent: "",
  durationDaysId: "",
  file: undefined as File | undefined,
});

const errors = reactive<Record<string, string | null>>({
  description: null,
  content: null,
  type: null,
  cinemaId: null,
  urlContent: null,
  durationDaysId: null,
  file: null,
});

const typeOptions = [
  { label: "Texto (Banner)", value: AddType.TEXT_BANNER },
  { label: "Media Vertical", value: AddType.MEDIA_VERTICAL },
  { label: "Media Horizontal", value: AddType.MEDIA_HORIZONTAL },
];

const durations = ref<{ id: string; days: number }[]>([]);
const cinemaPrices = ref<Prices | null>(null);

onMounted(async () => {
  try {
    durations.value = await getDurations();
    // Los precios dependen del cine; se cargarán al seleccionar cinemaId.
  } catch (e: any) {
    toast.error(e?.message);
  }
});

// Cargar precios por cine cuando se seleccione cinemaId
watch(() => form.cinemaId, async (val) => {
  const id = (val ?? '').trim()
  if (!id) {
    cinemaPrices.value = null
    return
  }
  try {
    cinemaPrices.value = await getPricesByCinemaId(id)
  } catch (e: any) {
    cinemaPrices.value = null
    toast.error(e?.message)
  }
})

const isText = computed(() => form.type === AddType.TEXT_BANNER)
const isMedia = computed(() => form.type === AddType.MEDIA_VERTICAL || form.type === AddType.MEDIA_HORIZONTAL)
const hasUrl = computed(() => !!form.urlContent?.trim())
const hasFile = computed(() => !!form.file)
const showUrlInput = computed(() => isMedia.value && !hasFile.value)
const showFileInput = computed(() => isMedia.value && !hasUrl.value)

watch(() => form.type, () => {
  // Si cambia a TEXT_BANNER, limpiar URL y archivo
  if (isText.value) {
    form.urlContent = ""
    form.file = undefined
    previewSrc.value = null
    // contenido debe estar disponible; la descripción puede quedar
  } else if (isMedia.value) {
    // Si cambia a media, limpiar el contenido de texto
    form.content = ""
  }
})

// Si el usuario escribe URL, limpiar archivo y preview
watch(() => form.urlContent, (val) => {
  if ((val ?? "").trim().length > 0 && form.file) {
    form.file = undefined
    previewSrc.value = null
    if (fileInput.value) fileInput.value.value = ""
  }
})

const selectedDuration = computed(() =>
  durations.value.find((d) => d.id === form.durationDaysId)
);
const selectedPrice = computed(() => {
  if (!form.type || !cinemaPrices.value) return 0
  const p = cinemaPrices.value
  switch (form.type) {
    case AddType.TEXT_BANNER: return p.amountTextBanner
    case AddType.MEDIA_VERTICAL: return p.amountMediaVertical
    case AddType.MEDIA_HORIZONTAL: return p.amountMediaHorizontal
    default: return 0
  }
})
const totalPrice = computed(() =>
  selectedDuration.value ? selectedDuration.value.days * selectedPrice.value : 0
);
const totalPriceFormatted = computed(() =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(
    totalPrice.value
  )
);

function validate(): boolean {
  errors.description = form.description.trim() ? null : "Requerido"
  errors.type = form.type ? null : "Requerido"
  errors.cinemaId = form.cinemaId.trim() ? null : "Requerido"
  errors.durationDaysId = form.durationDaysId ? null : "Requerido"

  // Reglas según tipo
  if (isText.value) {
    errors.content = form.content.trim() ? null : "Requerido"
    // Deben estar vacíos URL y archivo
    errors.urlContent = form.urlContent ? "No permitido para texto" : null
    errors.file = form.file ? "No permitido para texto" : null
  } else if (isMedia.value) {
    // Uno u otro, pero no ambos ni ninguno
    const urlOk = !!form.urlContent.trim()
    const fileOk = !!form.file
    if (urlOk && fileOk) {
      errors.urlContent = "No puede usar URL y archivo a la vez"
      errors.file = "No puede usar URL y archivo a la vez"
    } else if (!urlOk && !fileOk) {
      errors.urlContent = "Ingrese una URL o suba un archivo"
      errors.file = "Ingrese una URL o suba un archivo"
    } else {
      errors.urlContent = null
      errors.file = null
    }
    // Para media el campo content no aplica
    errors.content = null
  } else {
    // Tipo no seleccionado
    errors.content = null
    errors.urlContent = null
    errors.file = null
  }

  return Object.values(errors).every((e) => !e)
}

function onFileChange(e: Event) {
  const t = e.target as HTMLInputElement;
  const file = t.files?.[0];
  if (file) {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("El archivo excede los 20 MB permitidos")
      form.file = undefined
      previewSrc.value = null
      return
    }
    form.file = file
    // Si se selecciona archivo, borrar URL
    form.urlContent = ""
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = () => (previewSrc.value = String(reader.result))
      reader.readAsDataURL(file)
    } else {
      previewSrc.value = null
    }
  } else {
    form.file = undefined
  }
}

async function onSubmit() {
  if (!validate()) return;
  loading.value = true;
  try {
    const payload: CreateAnuncioMultipart = {
      content: form.content,
      description: form.description,
      type: form.type as AddType,
      cinemaId: form.cinemaId,
      userId: form.userId as string,
      urlContent: form.urlContent,
      durationDaysId: form.durationDaysId,
      file: form.file as File,
    };
    const created = await createAnuncio(payload);
    toast.success(`Anuncio creado exitosamente`);
    router.push(`/anuncios/mis-anuncios`);
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    loading.value = false;
  }
}

function goList() {
  router.push("/admin/anuncios");
}
</script>

<style scoped>
/* estilos mínimos */
</style>
