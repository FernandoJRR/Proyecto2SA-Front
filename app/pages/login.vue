<template>
  <div class="min-h-screen grid md:grid-cols-2 bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50">
    <!-- Left/hero side (admin context) -->
    <div class="relative hidden md:block overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200/70 via-sky-300/40 to-indigo-300/20" />
      <div class="absolute inset-0 p-10 flex flex-col justify-between">
        <header class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg" />
          <div class="text-xl font-semibold tracking-tight">Cines · Plataforma</div>
        </header>
        <div class="space-y-4">
          <h2 class="text-4xl font-extrabold tracking-tight leading-tight">Tu mundo de cine</h2>
          <ul class="text-sm text-slate-600 list-disc pl-5 space-y-1">
            <li>Compra de boletos y selección de asientos</li>
            <li>Cartelera por cine, horarios y preventa</li>
          </ul>
        </div>
        <footer class="text-xs text-slate-500">© 2025 Cines</footer>
      </div>
    </div>
    <!-- Right/form side -->
    <div class="flex items-center justify-center p-6 md:p-10">
      <div class="w-full max-w-md">
        <div class="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-xl">
          <div class="p-6 sm:p-8">
            <h1 class="text-2xl font-bold mb-1 text-center">Inicia sesión</h1>
            <Form v-slot="$form" :initialValues :resolver @submit="onFormSubmit" class="mt-4">
              <div class="flex flex-col gap-6 mb-6">
                <div>
                  <FloatLabel>
                    <label for="username">Usuario</label>
                    <InputText id="username" name="username" class="w-full" autocomplete="username" />
                  </FloatLabel>
                  <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{ $form.username.error?.message }}</Message>
                </div>
                <div>
                  <FloatLabel>
                    <Password id="password" name="password" :feedback="false" toggleMask :inputProps="{ autocomplete: 'current-password' }" />
                    <label for="password">Contraseña</label>
                  </FloatLabel>
                  <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{ $form.password.error?.message }}</Message>
                </div>
              </div>
              <Button type="submit" class="w-full py-2" :loading="loading" :disabled="loading">
                <span v-if="!loading">Ingresar</span>
                <span v-else>Ingresando…</span>
              </Button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { FloatLabel, InputText, Password } from 'primevue'
import { toast } from 'vue-sonner'
import { z } from 'zod'

const authStore = useAuthStore()
const { login } = authStore

const initialValues = reactive({
  username: '',
  password: '',
})

const resolver = ref(
  zodResolver(
    z.object({
      username: z.string().min(1, 'El username es obligatorio.'),
      password: z.string().min(1, 'La password es obligatoria.'),
    })
  )
)

const loading = ref(false)
const remember = ref(false)

const onFormSubmit = async (e: any) => {
  if (e.valid) {
    loading.value = true
    try {
      const payload: any = { email: e.values.username, password: e.values.password }
      await login(payload)
    } catch (err: any) {
      toast.error('No fue posible iniciar sesión')
    } finally {
      loading.value = false
    }
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    const last = localStorage.getItem('sap1_last_user')
    if (last) initialValues.username = last
  }
})

definePageMeta({ layout: 'login' })
</script>
