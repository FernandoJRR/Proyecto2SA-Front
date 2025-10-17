<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
    <main class="max-w-5xl mx-auto">
      <header class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Previsualizar anuncio
        </h1>
        <NuxtLink
          to="/admin/anuncios"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md transition"
        >
          <i class="pi pi-arrow-left mr-2"></i>
          Volver
        </NuxtLink>
      </header>

      <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
        Cargando anuncio…
      </div>

      <div v-else-if="!ad" class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        No se encontró el anuncio solicitado.
      </div>

      <div v-else class="rounded-xl border border-slate-200 bg-white p-4">
        <AdRenderer :ad="ad" />
        <div class="mt-4 text-sm text-slate-600">
          <div><span class="font-medium">Descripción:</span> {{ ad.description }}</div>
          <div class="mt-1"><span class="font-medium">Tipo:</span> {{ ad.type }}</div>
          <div class="mt-1"><span class="font-medium">Contenido:</span> {{ ad.contentType || 'texto' }}</div>
          <div class="mt-1"><span class="font-medium">Precio:</span> {{ formatMoney(ad.price) }}</div>
          <div class="mt-1"><span class="font-medium">Expira:</span> {{ formatDate(ad.addExpiration) }}</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { toast } from 'vue-sonner'
import AdRenderer from '~/components/AdRenderer.vue'
import { getById, type AnuncioViewResponseDTO } from '~/lib/api/anuncios/anuncio'

const route = useRoute()

const ad = ref<AnuncioViewResponseDTO | null>(null)
const loading = ref(true)

function formatMoney(n?: number | null) {
  if (typeof n !== 'number') return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GTQ', maximumFractionDigits: 2 }).format(n)
  } catch {
    return String(n)
  }
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    const fixed = iso.replace(/(\.\d{3})\d+$/, '$1')
    let d = new Date(fixed)
    if (isNaN(d.getTime())) {
      const noFrac = iso.split('.')[0]
      d = new Date(noFrac)
    }
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const id = String(route.params.id || '')
    if (!id) {
      toast.error('ID de anuncio inválido')
      return
    }
    ad.value = await getById(id)
  } catch (e: any) {
    ad.value = null
    toast.error(e?.message)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* estilos mínimos */
</style>