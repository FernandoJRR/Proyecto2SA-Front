<template>
  <div class="min-h-screen grid md:grid-cols-2 bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50">
    <!-- Hero side -->
    <div class="relative hidden md:block overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200/70 via-sky-300/40 to-indigo-300/20" />
      <div class="absolute inset-0 p-10 flex flex-col justify-between">
        <header class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg" />
          <div class="text-xl font-semibold tracking-tight">Cines · Plataforma</div>
        </header>
        <div class="space-y-4">
          <h2 class="text-4xl font-extrabold tracking-tight leading-tight">Únete a la experiencia</h2>
          <ul class="text-sm text-slate-600 list-disc pl-5 space-y-1">
            <li>Compra tus boletos y selecciona tus asientos favoritos</li>
            <li>Recibe preventas y beneficios personalizados</li>
          </ul>
        </div>
        <footer class="text-xs text-slate-500">© 2025 Cines</footer>
      </div>
    </div>
    <!-- Form side -->
    <div class="flex items-center justify-center p-6 md:p-10">
      <div class="w-full max-w-md">
        <div class="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-xl">
          <div class="p-6 sm:p-8">
            <h1 class="text-2xl font-bold mb-1 text-center">Crear cuenta</h1>
            <Form v-slot="$form" :initialValues :resolver @submit="onFormSubmit" class="mt-4">
              <div class="flex flex-col gap-6 mb-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FloatLabel>
                      <label for="firstName">Nombre</label>
                      <InputText id="firstName" name="firstName" class="w-full" autocomplete="given-name" />
                    </FloatLabel>
                    <Message
                      v-if="$form.firstName?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.firstName.error?.message }}
                    </Message>
                  </div>
                  <div>
                    <FloatLabel>
                      <label for="lastName">Apellido</label>
                      <InputText id="lastName" name="lastName" class="w-full" autocomplete="family-name" />
                    </FloatLabel>
                    <Message
                      v-if="$form.lastName?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.lastName.error?.message }}
                    </Message>
                  </div>
                </div>
                <div>
                  <FloatLabel>
                    <label for="email">Correo electrónico</label>
                    <InputText id="email" name="email" class="w-full" autocomplete="email" />
                  </FloatLabel>
                  <Message
                    v-if="$form.email?.invalid"
                    severity="error"
                    size="small"
                    variant="simple"
                  >
                    {{ $form.email.error?.message }}
                  </Message>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Tipo de cuenta</label>
                  <div class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white/60">
                    <span class="text-sm text-slate-700">Registrarme como sponsor</span>
                    <InputSwitch v-model="sponsor" aria-label="Registrarme como sponsor" />
                  </div>
                  <p class="mt-1 text-xs text-slate-500">Si activas esta opción, tu cuenta tendrá permisos para gestionar contenido como patrocinador.</p>
                </div>
                <div class="flex flex-col gap-4">
                  <div>
                    <FloatLabel class="w-full">
                      <Password
                        id="password"
                        name="password"
                        class="w-full"
                        :inputClass="'w-full'"
                        :feedback="false"
                        toggleMask
                        :inputProps="{ autocomplete: 'new-password' }"
                      />
                      <label for="password">Contraseña</label>
                    </FloatLabel>
                    <Message
                      v-if="$form.password?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.password.error?.message }}
                    </Message>
                  </div>
                  <div>
                    <FloatLabel class="w-full">
                      <Password
                        id="confirmPassword"
                        name="confirmPassword"
                        class="w-full"
                        :inputClass="'w-full'"
                        :feedback="false"
                        toggleMask
                        :inputProps="{ autocomplete: 'new-password' }"
                      />
                      <label for="confirmPassword">Repite la contraseña</label>
                    </FloatLabel>
                    <Message
                      v-if="$form.confirmPassword?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.confirmPassword.error?.message }}
                    </Message>
                  </div>
                </div>
              </div>
              <Button type="submit" class="w-full py-2" :loading="loading" :disabled="loading">
                <span v-if="!loading">Registrarme</span>
                <span v-else>Creando cuenta…</span>
              </Button>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <Button class="w-full p-button-outlined" severity="secondary" @click="goHome">
                  Ir al inicio
                </Button>
                <Button class="w-full p-button-outlined" severity="contrast" @click="goLogin">
                  Iniciar sesión
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { FloatLabel, InputText, Password } from 'primevue'
import InputSwitch from 'primevue/inputswitch'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { createNoAdministrativeUser } from '~/lib/api/users/user'

const initialValues = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const resolver = ref(
  zodResolver(
    z
      .object({
        firstName: z.string().min(2, 'El nombre es obligatorio.'),
        lastName: z.string().min(2, 'El apellido es obligatorio.'),
        email: z.string().email('Ingresa un correo válido.'),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
        confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden.',
        path: ['confirmPassword'],
      })
  )
)

const loading = ref(false)
const sponsor = ref(false)

const onFormSubmit = async (e: any) => {
  if (!e.valid) return
  loading.value = true

  try {
    const values = e.values
    await createNoAdministrativeUser({
      email: values.email,
      password: values.password,
      sponsor: sponsor.value,
      profile: {
        firstName: values.firstName,
        lastName: values.lastName,
      },
    })

    toast.success('Cuenta creada correctamente', {
      description: 'Ya puedes iniciar sesión con tus credenciales.',
    })
    navigateTo('/login')
  } catch (error: any) {
    toast.error('No fue posible crear la cuenta', {
      description: error?.message ?? 'Intenta nuevamente más tarde.',
    })
  } finally {
    loading.value = false
  }
}

function goHome() {
  navigateTo('/')
}
function goLogin() {
  navigateTo('/login')
}

definePageMeta({ layout: 'login' })
</script>
