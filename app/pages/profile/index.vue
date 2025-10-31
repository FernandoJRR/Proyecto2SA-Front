<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-3xl mx-auto mb-8" role="banner">
      <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">
        Mi perfil
      </h1>
      <p class="mt-2 text-sm text-slate-600">
        Revisa tu información y el estado actual de tu billetera virtual.
      </p>
    </header>

    <main class="max-w-3xl mx-auto space-y-8" role="main">
      <section class="rounded-2xl border border-slate-200 bg-white shadow p-6 space-y-4">
        <h2 class="text-xl font-semibold text-slate-900">Información personal</h2>
        <div v-if="!user" class="text-sm text-slate-600">
          Debes iniciar sesión para visualizar tu perfil.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
          <div>
            <p class="font-medium text-slate-600">Nombre</p>
            <p class="mt-1 text-slate-900 font-semibold">{{ user.username }}</p>
          </div>
          <div>
            <p class="font-medium text-slate-600">Identificador</p>
            <p class="mt-1 font-mono text-xs text-slate-800 break-all">{{ user.userId }}</p>
          </div>
          <div v-if="authStore.rol">
            <p class="font-medium text-slate-600">Rol</p>
            <p class="mt-1 text-slate-900 font-semibold uppercase">{{ authStore.rol }}</p>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Mi wallet</h2>
            <p class="text-sm text-slate-600">
              Consulta tu saldo disponible y la última actualización de tu billetera.
            </p>
          </div>
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            :loading="walletStatus === 'loading'"
            :disabled="walletStatus === 'loading' || !user"
            @click="() => walletRefetch()"
          />
        </div>

        <div v-if="!user" class="py-10 text-center text-slate-600">
          Debes iniciar sesión para consultar tu wallet.
        </div>
        <div
          v-else-if="walletStatus === 'loading' && !wallet"
          class="py-10 text-center text-slate-600"
        >
          <i class="pi pi-spinner pi-spin text-2xl mb-3" aria-hidden="true"></i>
          Cargando información de la wallet…
        </div>
        <div v-else-if="walletStatus === 'error'" class="py-10 text-center text-red-600 space-y-2">
          <p>{{ walletErrorMessage }}</p>
          <p class="text-xs text-red-500">
            Si aún no tienes una wallet creada, solicita soporte para generarla.
          </p>
        </div>
        <div v-else-if="!wallet" class="py-10 text-center text-slate-600 space-y-4">
          <p>No encontramos una wallet asociada a tu usuario.</p>
          <div class="flex flex-col items-center gap-2">
            <Button
              label="Crear wallet"
              icon="pi pi-wallet"
              severity="success"
              :loading="creatingWallet"
              :disabled="creatingWallet"
              @click="handleCreateWallet"
            />
            <p class="text-xs text-slate-500">Genera tu billetera para empezar a recibir saldo disponible.</p>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-700">
          <div class="rounded-xl bg-slate-900 text-white p-5 flex flex-col gap-3">
            <p class="text-xs uppercase tracking-wide text-slate-300">Saldo disponible</p>
            <p class="text-3xl font-bold">{{ formatCurrency(wallet.balance) }}</p>
            <p class="text-xs text-slate-400">
              ID de wallet:
              <span class="font-mono break-all">{{ wallet.id }}</span>
            </p>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <div>
              <p class="text-xs uppercase font-semibold text-slate-600">Propietario</p>
              <p class="mt-1 text-base text-slate-900">{{ user.username }}</p>
            </div>
            <div>
              <p class="text-xs uppercase font-semibold text-slate-600">Tipo</p>
              <p class="mt-1 text-base text-slate-900">{{ wallet.ownerType }}</p>
            </div>
            <div>
              <p class="text-xs uppercase font-semibold text-slate-600">Actualizado</p>
              <p class="mt-1 text-base text-slate-900">{{ lastUpdated }}</p>
            </div>
          </div>

          <div class="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div>
              <p class="text-sm font-semibold text-slate-800">Recargar billetera</p>
              <p class="text-xs text-slate-600">
                Ingresa el monto que deseas añadir a tu saldo disponible.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <InputNumber
                v-model="rechargeAmount"
                mode="currency"
                currency="GTQ"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                :min="1"
                :disabled="recharging"
                class="w-full sm:max-w-xs"
                placeholder="Q0.00"
              />
              <Button
                label="Recargar"
                icon="pi pi-plus"
                severity="success"
                :loading="recharging"
                :disabled="recharging || !canRecharge"
                @click="handleRechargeWallet"
              />
            </div>
            <p v-if="rechargeError" class="text-sm text-red-600">
              {{ rechargeError }}
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import { useAuthStore } from '~/stores/auth'
import {
  createWallet,
  getWalletByOwner,
  rechargeWallet,
  OwnerType,
  type Wallet,
} from '~/lib/api/wallets/wallet'
import { useCustomQuery } from '~/composables/useCustomQuery'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const userId = computed(() => user.value?.userId ?? '')

const {
  state: walletState,
  asyncStatus: walletAsyncStatus,
  refetch: walletRefetch,
} = useCustomQuery({
  key: ['profile-wallet', () => userId.value],
  query: async () => {
    const id = userId.value
    if (!id) {
      return null
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

const walletStatus = computed<'idle' | 'loading' | 'success' | 'error'>(() => {
  const v = walletAsyncStatus?.value ?? 'idle'
  return String(v) as 'idle' | 'loading' | 'success' | 'error'
})
const wallet = computed<(Wallet & { createdAt?: string; updatedAt?: string }) | null>(() => {
  const data = walletState.value?.data as (Wallet & { createdAt?: string; updatedAt?: string }) | null | undefined
  return data ?? null
})
const walletErrorMessage = computed(() => {
  const error = walletState.value?.error as { message?: string } | undefined
  return error?.message ?? 'No se pudo obtener la información de la wallet.'
})

const lastUpdated = computed(() => {
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
const recharging = ref(false)
const rechargeAmount = ref<number | null>(100)
const rechargeError = ref<string | null>(null)

const canRecharge = computed(() => Boolean(wallet.value && userId.value))

async function handleCreateWallet() {
  if (!userId.value || creatingWallet.value) return
  creatingWallet.value = true
  try {
    await createWallet({
      ownerId: userId.value,
      ownerType: OwnerType.CUSTOMER,
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

async function handleRechargeWallet() {
  if (!canRecharge.value || recharging.value) return

  rechargeError.value = null

  const amount = typeof rechargeAmount.value === 'number' ? rechargeAmount.value : 0
  if (!Number.isFinite(amount) || amount <= 0) {
    rechargeError.value = 'Ingresa un monto mayor a cero.'
    return
  }

  recharging.value = true

  try {
    await rechargeWallet(userId.value, { amount })
    toast.success('Saldo recargado correctamente.')
    rechargeAmount.value = 100
    await walletRefetch()
  } catch (error: any) {
    const message = error?.data?.message ?? error?.message ?? 'No se pudo recargar la wallet.'
    rechargeError.value = message
    toast.error(message)
  } finally {
    recharging.value = false
  }
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(value)
}
</script>
