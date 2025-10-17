<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <header class="max-w-7xl mx-auto mb-6">
      <h1
        class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
      >
        Películas disponibles
      </h1>
      <p class="text-slate-600">
        Consulta la cartelera completa. 20 por página.
      </p>
    </header>

    <!-- Filtros -->
    <section
      class="max-w-7xl mx-auto mb-6 bg-white rounded-lg border border-slate-200 p-4"
    >
      <h2 class="text-lg font-semibold text-slate-800 mb-3">Filtros</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Título -->
        <InputText
          v-model.trim="filters.title"
          placeholder="Título..."
          class="w-full"
        />

        <!-- Clasificación -->
        <Dropdown
          v-model="filters.classificationId"
          :options="classifications"
          optionLabel="name"
          optionValue="id"
          placeholder="Clasificación"
          class="w-full"
        />

        <!-- Categorías -->
        <MultiSelect
          v-model="filters.categoryIds"
          :options="categories"
          optionLabel="name"
          optionValue="id"
          placeholder="Categorías"
          display="chip"
          class="w-full"
          filter
        />

        <!-- Activo (solo admin) -->
        <div
          v-if="isAdmin"
          class="flex items-center justify-between border rounded p-2"
        >
          <label class="text-sm text-slate-700">Activas</label>
          <InputSwitch v-model="filters.active" />
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-3 justify-end">
        <Button
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          @click="resetFilters"
        >
          Limpiar
        </Button>
        <Button label="Buscar" icon="pi pi-search" @click="applyFilters(0)" />
      </div>
    </section>

    <!-- Grid -->
    <main class="max-w-7xl mx-auto">
      <!-- Skeletons while loading -->
      <div
        v-if="loading"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-5"
      >
        <div
          v-for="n in 20"
          :key="n"
          class="rounded-xl overflow-hidden border border-slate-200 bg-white"
        >
          <div class="aspect-[2/3] bg-slate-200 animate-pulse" />
          <div class="p-3 space-y-2">
            <div class="h-4 bg-slate-200 rounded animate-pulse" />
            <div class="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>

      <!-- Movies grid -->
      <div
        v-else-if="movies.length"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-5"
      >
        <NuxtLink
          v-for="m in movies"
          :key="m.id"
          :to="`/peliculas/${m.id}`"
          class="group rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition"
        >
          <div class="aspect-[2/3] bg-slate-100 overflow-hidden">
            <img
              :src="m.urlImage || placeholder"
              :alt="m.title"
              class="w-full h-full object-cover group-hover:scale-[1.02] transition"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </div>
          <div class="p-3">
            <h2 class="text-sm font-semibold text-slate-900 line-clamp-2">
              {{ m.title }}
            </h2>
            <p class="text-xs text-slate-600 mt-1">{{ m.duration }} min</p>
            <p class="text-xs text-slate-600 mt-1">
              {{ m.classification?.name || "—" }} ·
              {{ m.classification?.description || "—" }}
            </p>
            <p class="text-xs text-slate-600 mt-1">
              {{ m.categories?.map((c) => c.name).join(", ") || "—" }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-16 text-center text-slate-600"
      >
        <i
          class="pi pi-inbox text-3xl mb-3 text-slate-400"
          aria-hidden="true"
        ></i>
        No hay películas disponibles por ahora.
      </div>

      <!-- Pagination -->
      <div class="mt-8 flex justify-center">
        <Paginator
          :rows="PAGE_SIZE"
          :totalRecords="totalElements"
          :first="page * PAGE_SIZE"
          :rowsPerPageOptions="[]"
          @page="onPage"
          :template="{
            layout: 'PrevPageLink PageLinks NextPageLink',
            PrevPageLink: 'PrevPageLink',
            NextPageLink: 'NextPageLink',
            PageLinks: 'PageLinks',
          }"
        />
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import Paginator from "primevue/paginator";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import MultiSelect from "primevue/multiselect";
import InputSwitch from "primevue/inputswitch";
import Button from "primevue/button";

import {
  getAllPaginated,
  searchMovies,
  type MovieResponseDTO,
} from "~/lib/api/movies/movie";
import {
  getAllClassifications,
  type ClassificationResponseDTO,
} from "~/lib/api/movies/classification";
import {
  searchCategoriesByName,
  type CategoryResponseDTO,
} from "~/lib/api/movies/category";
import { isAdmin as isAdminRole } from "~/lib/auth/roles";

const authStore = useAuthStore();
const { rol: currentUserRole } = storeToRefs(authStore);

const PAGE_SIZE = 20;

const page = ref(0);
const loading = ref(true);
const movies = ref<MovieResponseDTO[]>([]);
const totalElements = ref(0);
const placeholder =
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop"; // póster genérico

const isAdmin = computed(() => isAdminRole(currentUserRole.value ?? ""));

// ---- Filtros ----
const filters = reactive<{
  title: string;
  classificationId: string | null;
  categoryIds: string[];
  active: boolean;
}>({
  title: "",
  classificationId: null,
  categoryIds: [],
  active: true,
});

// ---- Opciones para filtros ----
const classifications = ref<ClassificationResponseDTO[]>([]);
const categories = ref<CategoryResponseDTO[]>([]);

async function loadFiltersData() {
  try {
    classifications.value = await getAllClassifications();
  } catch {
    classifications.value = [];
  }
  try {
    // vacío => el backend devuelve todo
    categories.value = await searchCategoriesByName("");
  } catch {
    categories.value = [];
  }
}

// ---- Búsqueda / Carga de página con filtros ----
async function applyFilters(p = 0) {
  loading.value = true;
  try {
    const query = {
      title: filters.title || null,
      classificationId: filters.classificationId || null,
      categoryIds: filters.categoryIds.length ? filters.categoryIds : null,
      active: filters.active,
    };
    const resp = await searchMovies(query, p);
    movies.value = resp.content;
    totalElements.value = resp.totalElements;
    page.value = resp.number;
  } catch (e) {
    movies.value = [];
    totalElements.value = 0;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.title = "";
  filters.classificationId = null;
  filters.categoryIds = [];
  filters.active = true;
  applyFilters(0);
}

function onPage(e: any) {
  // e.page es 0-based
  if (e?.page !== undefined && e.page !== page.value) {
    applyFilters(e.page);
    // scroll suave al inicio del grid
    if (process.client) window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

onMounted(async () => {
  await loadFiltersData();
  await applyFilters(0);
});
</script>

<style scoped>
/* opcional: ajuste de enlaces de paginación para una vista más limpia */
:deep(.p-paginator) {
  background-color: transparent;
  border: 0;
}
:deep(.p-paginator .p-paginator-pages .p-paginator-page) {
  border-radius: 0.375rem; /* md */
}
</style>
