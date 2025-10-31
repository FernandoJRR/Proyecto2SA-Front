<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-4xl mx-auto mb-8" role="banner">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/cines">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al listado de cines" />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Wallet del cine
            </h1>
            <p class="text-sm text-slate-600">
              Visualiza y administra la billetera asociada a este cine.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="walletStatus !== 'loading'"
            icon="pi pi-refresh"
            label="Actualizar"
            size="small"
            severity="secondary"
            outlined
            @click="() => walletRefetch()"
          />
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto space-y-8" role="main">
      <section class="rounded-2xl border border-slate-200 bg-white shadow p-6 space-y-4">
        <h2 class="text-lg font-semibold text-slate-900">Información del cine</h2>

        <div v-if="cinemaStatus === 'loading' && !cinema" class="py-10 text-center text-slate-600">
          <i class="pi pi-spinner pi-spin text-2xl mb-3" aria-hidden="true"></i>
          Cargando información del cine…
        </div>
        <div v-else-if="cinemaStatus === 'error'" class="py-10 text-center text-red-600 space-y-2">
          <p>{{ cinemaErrorMessage }}</p>
          <Button
            icon="pi pi-refresh"
            label="Reintentar"
            size="small"
            severity="secondary"
            outlined
            @click="() => cinemaRefetch()"
          />
        </div>
        <div v-else-if="!cinema" class="py-10 text-center text-slate-600">
          No encontramos el cine solicitado.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-700">
          <div>
            <p class="font-medium text-slate-600">Nombre del cine</p>
            <p class="mt-1 text-slate-900 text-lg font-semibold">{{ cinema.name }}</p>
          </div>
          <div>
            <p class="font-medium text-slate-600">Compañía</p>
            <p class="mt-1 text-slate-900 font-semibold">{{ cinema.company?.name ?? '—' }}</p>
          </div>
          <div>
            <p class="font-medium text-slate-600">Costo por día</p>
            <p class="mt-1 text-slate-900 font-semibold">{{ formatCurrency(cinema.costPerDay) }}</p>
          </div>
          <div>
            <p class="font-medium text-slate-600">Registrado desde</p>
            <p class="mt-1 text-slate-900 font-semibold">{{ formatDate(cinema.createdAt) }}</p>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow p-6 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Wallet del cine</h2>
            <p class="text-sm text-slate-600">
              Si el cine aún no tiene una wallet, puedes crearla desde esta vista.
            </p>
          </div>
          <Button
            v-if="!wallet && walletStatus !== 'loading'"
            label="Crear wallet"
            icon="pi pi-wallet"
            severity="success"
            :loading="creatingWallet"
            :disabled="creatingWallet"
            @click="handleCreateWallet"
          />
        </div>

        <div v-if="walletStatus === 'loading' && !wallet" class="py-10 text-center text-slate-600">
          <i class="pi pi-spinner pi-spin text-2xl mb-3" aria-hidden="true"></i>
          Consultando wallet…
        </div>
        <div v-else-if="walletStatus === 'error'" class="py-10 text-center text-red-600 space-y-2">
          <p>{{ walletErrorMessage }}</p>
          <Button
            icon="pi pi-refresh"
            label="Reintentar"
            size="small"
            severity="secondary"
            outlined
            @click="() => walletRefetch()"
          />
        </div>
        <div v-else-if="!wallet" class="py-10 text-center text-slate-600 space-y-2">
          <p>
            Este cine aún no tiene una wallet registrada.
          </p>
          <p class="text-xs text-slate-500">
            Crea la wallet para empezar a registrar movimientos y recargas.
          </p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-700">
          <div class="rounded-2xl bg-slate-900 text-white p-6 space-y-4">
            <p class="text-xs uppercase tracking-wide text-slate-300">Saldo disponible</p>
            <p class="text-4xl font-bold">{{ formatCurrency(wallet.balance) }}</p>
            <p class="text-xs text-slate-400">
              ID de wallet:
              <span class="font-mono break-all">{{ wallet.id }}</span>
            </p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-3">
            <div>
              <p class="text-xs uppercase font-semibold text-slate-600">Propietario</p>
              <p class="mt-1 text-base text-slate-900">{{ cinema?.name ?? '—' }}</p>
            </div>
            <div>
              <p class="text-xs uppercase font-semibold text-slate-600">Tipo</p>
              <p class="mt-1 text-base text-slate-900">{{ wallet.ownerType }}</p>
            </div>
            <div>
              <p class="text-xs uppercase font-semibold text-slate-600">Actualizado</p>
              <p class="mt-1 text-base text-slate-900">{{ walletLastUpdated }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Button from 'primevue/button'
import { toast } from 'vue-sonner'
import { getCinemaById, type CinemaResponseDTO } from '~/lib/api/cinema/cinema'
import { createWallet, getWalletByOwner, OwnerType, type Wallet } from '~/lib/api/wallets/wallet'
import { useCustomQuery } from '~/composables/useCustomQuery'

const route = useRoute()

const cinemaId = computed(() => {
  const value = route.params.id
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? ''
  return ''
})

const {
  state: cinemaState,
  asyncStatus: cinemaAsyncStatus,
  refetch: cinemaRefetch,
} = useCustomQuery({
  key: ['cinema-wallet-cinema', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) {
      throw new Error('Identificador del cine no disponible.')
    }
    return getCinemaById(id)
  },
})

const cinemaStatus = computed(() => cinemaAsyncStatus?.value ?? 'loading')
const cinema = computed<CinemaResponseDTO | null>(() => {
  const data = cinemaState.value?.data as CinemaResponseDTO | undefined
  return data ?? null
})
const cinemaErrorMessage = computed(() => {
  const error = cinemaState.value?.error as { message?: string } | undefined
  return error?.message ?? 'No se pudo cargar la información del cine.'
})

const {
  state: walletState,
  asyncStatus: walletAsyncStatus,
  refetch: walletRefetch,
} = useCustomQuery({
  key: ['cinema-wallet', () => cinemaId.value],
  query: async () => {
    const id = cinemaId.value
    if (!id) {
      throw new Error('Identificador del cine no disponible.')
    }
    try {
      return await getWalletByOwner(id)
    } catch (error: any) {
      const statusCode = error?.statusCode ?? error?.status ?? error?.response?.status
      if (statusCode === 404) {
        return null
      }
      throw error
    }
  },
})

const walletStatus = computed(() => walletAsyncStatus?.value ?? 'idle')
const wallet = computed<(Wallet & { createdAt?: string; updatedAt?: string }) | null>(() => {
  const data = walletState.value?.data as (Wallet & { createdAt?: string; updatedAt?: string }) | null | undefined
  return data ?? null
})
const walletErrorMessage = computed(() => {
  const error = walletState.value?.error as { message?: string } | undefined
  return error?.message ?? 'No se pudo obtener la wallet del cine.'
})
const walletLastUpdated = computed(() => {
  const updatedAt = wallet.value?.updatedAt ?? wallet.value?.createdAt
  if (!updatedAt) return '—'
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-GT', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const creatingWallet = ref(false)

async function handleCreateWallet() {
  if (!cinemaId.value || creatingWallet.value) return
  creatingWallet.value = true
  try {
    await createWallet({
      ownerId: cinemaId.value,
      ownerType: OwnerType.CINEMA,
    })
    toast.success('Wallet creada correctamente.')
    await walletRefetch()
  } catch (error: any) {
    const message = error?.data?.message ?? error?.message ?? 'No se pudo crear la wallet.'
    toast.error(message)
  } finally {
    creatingWallet.value = false
  }
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}
</script>
