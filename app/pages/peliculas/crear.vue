<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
    <main class="max-w-3xl mx-auto">
      <header class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Crear película
        </h1>
        <p class="text-slate-600">
          Completa la información y sube el póster. Los campos marcados con * son obligatorios.
        </p>
      </header>

      <div class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <form @submit.prevent="onSubmit" novalidate>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <!-- Título -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Título *</label>
              <InputText v-model.trim="form.title" placeholder="Ej. John Wick 2" class="w-full" />
              <small v-if="errors.title" class="text-red-600">{{ errors.title }}</small>
            </div>

            <!-- Clasificación -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Clasificación *</label>
              <Dropdown
                v-model="form.classificationId"
                :options="classifications"
                optionLabel="name"
                optionValue="id"
                placeholder="Selecciona una clasificación"
                class="w-full"
              />
              <p v-if="selectedClassification?.description" class="mt-2 text-sm text-slate-600">
                {{ selectedClassification.description }}
              </p>
              <small v-if="errors.classificationId" class="text-red-600">{{ errors.classificationId }}</small>
            </div>

            <!-- Duración -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Duración (min) *</label>
              <InputNumber v-model="form.duration" inputId="duration" :min="1" :useGrouping="false" class="w-full" />
              <small v-if="errors.duration" class="text-red-600">{{ errors.duration }}</small>
            </div>

            <!-- Sinopsis -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Sinopsis *</label>
              <Textarea v-model.trim="form.sinopsis" :autoResize="true" rows="4" class="w-full" placeholder="Resumen breve de la película" />
              <small v-if="errors.sinopsis" class="text-red-600">{{ errors.sinopsis }}</small>
            </div>

            <!-- Director -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Director *</label>
              <InputText v-model.trim="form.director" placeholder="Ej. Chad Stahelski" class="w-full" />
              <small v-if="errors.director" class="text-red-600">{{ errors.director }}</small>
            </div>

            <!-- Reparto -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Reparto (una línea por actor) *</label>
              <Textarea v-model.trim="form.casting" :autoResize="true" rows="4" class="w-full" placeholder="- Keanu Reeves como John Wick&#10;- Ian McShane como Winston" />
              <small v-if="errors.casting" class="text-red-600">{{ errors.casting }}</small>
            </div>

            <!-- Categorías -->
            <div class="sm:col-span-2">
    <label class="block text-sm font-medium text-slate-700 mb-1">Categorías *</label>
    <div class="flex items-center gap-3 mb-3">
      <InputText v-model.trim="categorySearch" placeholder="Buscar categorías (vacío = todas)..." class="w-full" />
    </div>
    <DataTable
      :value="categories"
      v-model:selection="selectedCategories"
      selectionMode="multiple"
      dataKey="id"
      paginator
      :rows="5"
      :rowsPerPageOptions="[5]"
      class="rounded-lg border border-slate-200"
      tableStyle="min-width: 24rem"
    >
      <Column selectionMode="multiple" headerStyle="width:3rem"></Column>
      <Column field="name" header="Nombre"></Column>
    </DataTable>
    <small v-if="errors.categoriesId" class="text-red-600">{{ errors.categoriesId }}</small>
  </div>

            <!-- Imagen -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-2">Póster (JPG/PNG) *</label>
              <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" />
              <small v-if="errors.image" class="block text-red-600 mt-1">{{ errors.image }}</small>

              <!-- Preview -->
              <div v-if="previewSrc" class="mt-3 w-40 rounded-lg overflow-hidden border border-slate-200">
                <img :src="previewSrc" alt="Previsualización" class="w-full h-auto object-cover" />
              </div>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" :loading="loading" :disabled="loading">
              <span v-if="!loading">Crear</span>
              <span v-else>Guardando…</span>
            </Button>
            <Button severity="secondary" outlined @click="goList" type="button">Cancelar</Button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { ClassificationResponseDTO } from '~/lib/api/movies/classification'
import { getAllClassifications } from '~/lib/api/movies/classification'
import type { CategoryResponseDTO } from '~/lib/api/movies/category'
import { searchCategoriesByName } from '~/lib/api/movies/category'
import { createMovie, type CreateUpdateMovieMultipart } from '~/lib/api/movies/movie'
import { toast } from 'vue-sonner'

const router = useRouter()

// ----- Estado del formulario (nativo) -----
const form = reactive({
  title: '',
  classificationId: '',
  categoriesId: [] as string[],
  duration: 120 as number,
  sinopsis: '',
  director: '',
  casting: '',
  image: undefined as File | undefined
})

const errors = reactive<Record<string, string | null>>({
  title: null,
  classificationId: null,
  categoriesId: null,
  duration: null,
  sinopsis: null,
  director: null,
  casting: null,
  image: null
})

const loading = ref(false)
const previewSrc = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// ----- Clasificaciones y Categorías -----
const classifications = ref<ClassificationResponseDTO[]>([])
const selectedClassification = computed<ClassificationResponseDTO | null>(() => {
  return classifications.value.find(c => c.id === form.classificationId) || null
})
const categorySearch = ref('')
const categories = ref<CategoryResponseDTO[]>([])
const selectedCategories = ref<CategoryResponseDTO[]>([])

async function loadCategories(q: string | null) {
  try {
    // Si q es null o vacío, el backend devuelve todo
    categories.value = await searchCategoriesByName(q ?? '')
  } catch {
    categories.value = []
  }
}

// Cargar categorías iniciales (todas)
onMounted(async () => {
  try {
    classifications.value = await getAllClassifications()
  } catch {
    classifications.value = []
  }
  await loadCategories('')
})

// Búsqueda con debounce
let catTimer: any = null
watch(categorySearch, (val) => {
  if (catTimer) clearTimeout(catTimer)
  const q = (val ?? '').trim()
  catTimer = setTimeout(() => loadCategories(q.length ? q : ''), 300)
})

// ----- Validación mínima -----
function validate(): boolean {
  errors.title = form.title.trim() ? null : 'Requerido'
  errors.classificationId = form.classificationId.trim() ? null : 'Requerido'
  errors.duration = form.duration && Number(form.duration) > 0 ? null : 'Requerido'
  errors.sinopsis = form.sinopsis.trim() ? null : 'Requerido'
  errors.director = form.director.trim() ? null : 'Requerido'
  errors.casting = form.casting.trim() ? null : 'Requerido'
  errors.categoriesId = selectedCategories.value.length > 0 ? null : 'Requerido'
  errors.image = form.image ? null : 'Requerido'

  return Object.values(errors).every((e) => !e)
}

// ----- Imagen / preview -----
function onFileChange(e: Event) {
  const t = e.target as HTMLInputElement
  const file = t.files?.[0]
  if (file) {
    form.image = file
    const reader = new FileReader()
    reader.onload = () => (previewSrc.value = String(reader.result))
    reader.readAsDataURL(file)
  } else {
    previewSrc.value = null
    form.image = undefined
  }
}

// ----- Submit -----
async function onSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    form.categoriesId = selectedCategories.value.map(c => c.id)
    const payload: CreateUpdateMovieMultipart = {
      title: form.title,
      classificationId: form.classificationId,
      categoriesId: form.categoriesId,
      duration: form.duration,
      sinopsis: form.sinopsis,
      director: form.director,
      casting: form.casting,
      image: form.image as File
    }
    const created = await createMovie(payload)
    toast.success(`Película "${created.title}" creada`)
    router.push(`/peliculas/${created.id}`)
  } catch (err) {
    toast.error('No fue posible crear la película')
  } finally {
    loading.value = false
  }
}

function goList() {
  router.push('/peliculas')
}
</script>

<style scoped>
/* estilos mínimos */
</style>