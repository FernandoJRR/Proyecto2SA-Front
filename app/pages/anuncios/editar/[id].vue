<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
    <main class="max-w-3xl mx-auto">
      <header class="mb-6 flex items-center justify-between">
        <div>
          <h1
            class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
          >
            Editar anuncio
          </h1>
          <p class="text-slate-600">
            Actualiza el contenido de tu anuncio. El tipo no se puede cambiar.
          </p>
        </div>
        <NuxtLink
          to="/anuncios/mis-anuncios"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md transition"
        >
          <i class="pi pi-arrow-left mr-2"></i>
          Volver
        </NuxtLink>
      </header>

      <div class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div v-if="loading" class="text-slate-600">Cargando…</div>
        <div v-else-if="!ad" class="text-red-600">
          No se encontró el anuncio.
        </div>
        <form v-else @submit.prevent="onSubmit" novalidate>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <!-- Tipo (solo lectura) -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Tipo</label
              >
              <div
                class="px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-800"
              >
                {{ ad?.type }}
              </div>
              <p class="mt-1 text-xs text-slate-500">
                El tipo del anuncio no puede modificarse.
              </p>
            </div>

            <!-- Descripción -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Descripción *</label
              >
              <Textarea
                v-model.trim="form.description"
                rows="3"
                class="w-full"
                placeholder="Ej. Trailer actualizado"
              />
              <small v-if="errors.description" class="text-red-600">{{
                errors.description
              }}</small>
            </div>

            <!-- Contenido: solo para TEXT_BANNER -->
            <div class="sm:col-span-2" v-if="isText">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Contenido del banner *</label
              >
              <Textarea
                v-model.trim="form.content"
                rows="4"
                class="w-full"
                placeholder="Texto del banner"
              />
              <small v-if="errors.content" class="text-red-600">{{
                errors.content
              }}</small>
            </div>

            <!-- URL (solo media; alterna con archivo) -->
            <div class="sm:col-span-2" v-if="showUrlInput">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >URL del contenido</label
              >
              <InputText
                v-model.trim="form.urlContent"
                placeholder="https://youtu.be/... o URL de imagen/video"
                class="w-full"
              />
              <small v-if="errors.urlContent" class="text-red-600">{{
                errors.urlContent
              }}</small>
              <p class="text-xs text-slate-500 mt-1">
                Para media puedes enviar <strong>URL</strong> o
                <strong>archivo</strong>, no ambos.
              </p>
            </div>

            <!-- Archivo (solo media; alterna con URL) -->
            <div class="sm:col-span-2" v-if="showFileInput">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Archivo (máx 20 MB)</label
              >
              <input ref="fileInput" type="file" @change="onFileChange" />
              <small v-if="errors.file" class="block text-red-600 mt-1">{{
                errors.file
              }}</small>
              <div
                v-if="previewSrc"
                class="mt-3 w-48 rounded-lg overflow-hidden border border-slate-200"
              >
                <img
                  :src="previewSrc"
                  alt="Previsualización"
                  class="w-full h-auto object-cover"
                />
              </div>
            </div>

            <!-- Ayuda -->
            <div class="sm:col-span-2">
              <div class="text-xs text-slate-500 space-y-1">
                <p v-if="isText">
                  Este anuncio es de texto. No se admite URL ni archivo.
                </p>
                <p v-else>
                  Este anuncio es multimedia. Debes proporcionar una URL o subir
                  un archivo, pero no ambos.
                </p>
              </div>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" :loading="saving" :disabled="saving">
              <span v-if="!saving">Guardar cambios</span>
              <span v-else>Guardando…</span>
            </Button>
            <Button severity="secondary" outlined @click="goBack" type="button"
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
import { toast } from "vue-sonner";
import { useRoute, useRouter } from "#imports";
import {
  getById,
  updateAnuncio,
  type AnuncioViewResponseDTO,
  AddType,
  type UpdateAnuncioMultipart,
} from "~/lib/api/anuncios/anuncio";

const route = useRoute();
const router = useRouter();

const ad = ref<AnuncioViewResponseDTO | null>(null);
const loading = ref(true);
const saving = ref(false);

const form = reactive({
  description: "",
  content: "",
  urlContent: "",
  file: undefined as File | undefined,
});

const errors = reactive<Record<string, string | null>>({
  description: null,
  content: null,
  urlContent: null,
  file: null,
});

const fileInput = ref<HTMLInputElement | null>(null);
const previewSrc = ref<string | null>(null);

// Helpers de tipo
const isText = computed(() => ad.value?.type === AddType.TEXT_BANNER);
const isMedia = computed(
  () =>
    ad.value?.type === AddType.MEDIA_VERTICAL ||
    ad.value?.type === AddType.MEDIA_HORIZONTAL
);
const hasUrl = computed(() => !!form.urlContent?.trim());
const hasFile = computed(() => !!form.file);
const showUrlInput = computed(() => isMedia.value && !hasFile.value);
const showFileInput = computed(() => isMedia.value && !hasUrl.value);

onMounted(async () => {
  loading.value = true;
  try {
    const id = String(route.params.id || "");
    if (!id) {
      toast.error("ID de anuncio inválido");
      return;
    }
    ad.value = await getById(id);
    // Rellenar form
    form.description = ad.value.description || "";
    form.content = ad.value.content || "";
    form.urlContent = ad.value.urlContent || "";
  } catch (e: any) {
    ad.value = null;
    toast.error(e?.message);
  } finally {
    loading.value = false;
  }
});

watch(
  () => form.urlContent,
  (val) => {
    if ((val ?? "").trim().length > 0 && form.file) {
      form.file = undefined;
      previewSrc.value = null;
      if (fileInput.value) fileInput.value.value = "";
    }
  }
);

function onFileChange(e: Event) {
  const t = e.target as HTMLInputElement;
  const file = t.files?.[0];
  if (file) {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("El archivo excede los 20 MB permitidos");
      form.file = undefined;
      previewSrc.value = null;
      return;
    }
    form.file = file;
    // Si se selecciona archivo, borrar URL
    form.urlContent = "";
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => (previewSrc.value = String(reader.result));
      reader.readAsDataURL(file);
    } else {
      previewSrc.value = null;
    }
  } else {
    form.file = undefined;
  }
}

function validate(): boolean {
  errors.description = form.description.trim() ? null : "Requerido";

  if (isText.value) {
    errors.content = form.content.trim() ? null : "Requerido";
    errors.urlContent = form.urlContent ? "No permitido para texto" : null;
    errors.file = form.file ? "No permitido para texto" : null;
  } else if (isMedia.value) {
    const urlOk = !!form.urlContent.trim();
    const fileOk = !!form.file;
    if (urlOk && fileOk) {
      errors.urlContent = "No puede usar URL y archivo a la vez";
      errors.file = "No puede usar URL y archivo a la vez";
    } else if (!urlOk && !fileOk) {
      errors.urlContent = "Ingrese una URL o suba un archivo";
      errors.file = "Ingrese una URL o suba un archivo";
    } else {
      errors.urlContent = null;
      errors.file = null;
    }
    errors.content = null;
  } else {
    // tipo desconocido
    errors.content = null;
    errors.urlContent = null;
    errors.file = null;
  }

  return Object.values(errors).every((e) => !e);
}

async function onSubmit() {
  if (!ad.value) return;
  if (!validate()) return;
  saving.value = true;
  try {
    const payload: UpdateAnuncioMultipart = {
      content: form.content,
      description: form.description,
      urlContent: form.urlContent,
      file: form.file as File,
    };
    const updated = await updateAnuncio(ad.value.id, payload);
    toast.success("Anuncio actualizado");
    router.push("/anuncios/mis-anuncios");
  } catch (e: any) {
    toast.error(e?.message);
  } finally {
    saving.value = false;
  }
}

function goBack() {
  router.push("/anuncios/mis-anuncios");
}
</script>

<style scoped>
/* estilos mínimos */
</style>
