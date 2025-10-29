<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-4xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <NuxtLink to="/admin">
            <Button icon="pi pi-arrow-left" label="Volver" size="small" aria-label="Volver al panel" />
          </NuxtLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Crear usuario administrador
            </h1>
            <p class="text-slate-600">
              Registra cuentas con privilegios administrativos siguiendo las políticas de acceso.
            </p>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto" role="main">
      <div class="rounded-2xl border border-slate-200 bg-white shadow">
        <div class="p-6 sm:p-8">
          <Form v-slot="$form" :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit">
            <div class="space-y-8">
              <section>
                <h2 class="text-lg font-semibold mb-4">Datos personales</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              </section>

              <section>
                <h2 class="text-lg font-semibold mb-4">Credenciales de acceso</h2>
                <div class="space-y-6">
                  <div>
                    <FloatLabel>
                      <label for="email">Correo electrónico</label>
                      <InputText id="email" name="email" type="email" class="w-full" autocomplete="email" />
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
                    <label class="block text-sm font-medium text-slate-700 mb-1">Rol administrativo</label>
                    <Dropdown
                      id="role"
                      name="role"
                      :modelValue="$form.role?.value ?? initialValues.role"
                      :options="roleOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Selecciona un rol"
                      class="w-full"
                      @update:modelValue="$form.role?.setValue?.($event)"
                    />
                    <Message
                      v-if="$form.role?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.role.error?.message }}
                    </Message>
                    <p class="mt-1 text-xs text-slate-500" v-if="$form.role?.value === 'ADMIN'">
                      Acceso completo a la administración del sistema.
                    </p>
                    <p class="mt-1 text-xs text-slate-500" v-else-if="$form.role?.value === 'CINEMA_ADMIN'">
                      Acceso enfocado a la gestión de cines y anuncios.
                    </p>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        <label for="confirmPassword">Confirmar contraseña</label>
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
              </section>
            </div>

            <div class="mt-8 flex items-center justify-end gap-2">
              <Button type="button" label="Cancelar" severity="secondary" outlined @click="goBack" />
              <Button type="submit" label="Crear usuario" icon="pi pi-save" :loading="loading" :disabled="loading" />
            </div>
          </Form>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { FloatLabel, InputText, Password } from 'primevue'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { createAdministrativeUser } from '~/lib/api/users/user'

const initialValues = reactive({
  firstName: '',
  lastName: '',
  email: '',
  role: 'ADMIN' as 'ADMIN' | 'CINEMA_ADMIN',
  password: '',
  confirmPassword: '',
})

const resolver = ref(
  zodResolver(
    z
      .object({
        firstName: z
          .string()
          .min(2, 'El nombre debe tener al menos 2 caracteres.')
          .max(50, 'El nombre debe tener máximo 50 caracteres.'),
        lastName: z
          .string()
          .min(2, 'El apellido debe tener al menos 2 caracteres.')
          .max(50, 'El apellido debe tener máximo 50 caracteres.'),
        email: z
          .string()
          .email('Ingresa un correo válido.')
          .min(5, 'El correo debe tener al menos 5 caracteres.')
          .max(100, 'El correo debe tener máximo 100 caracteres.'),
        password: z
          .string()
          .min(8, 'La contraseña debe tener al menos 8 caracteres.')
          .max(100, 'La contraseña debe tener máximo 100 caracteres.'),
        confirmPassword: z.string().min(1, 'Confirma la contraseña.'),
        role: z.enum(['ADMIN', 'CINEMA_ADMIN'], {
          required_error: 'Selecciona un rol.',
        }),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden.',
        path: ['confirmPassword'],
      })
  )
)

const loading = ref(false)

const roleOptions = [
  { label: 'Administrador general', value: 'ADMIN' as const },
  { label: 'Administrador de cine', value: 'CINEMA_ADMIN' as const },
]

const onFormSubmit = async (e: any) => {
  if (!e.valid) return
  loading.value = true

  try {
    const values = e.values

    await createAdministrativeUser({
      email: values.email,
      password: values.password,
      role: values.role,
      profile: {
        firstName: values.firstName,
        lastName: values.lastName,
      },
    })

    toast.success('Usuario administrador creado correctamente', {
      description: 'Ahora puede iniciar sesión con sus credenciales.',
    })
    navigateTo('/admin')
  } catch (error: any) {
    toast.error('No fue posible crear el usuario', {
      description: error?.message ?? 'Intenta nuevamente más tarde.',
    })
  } finally {
    loading.value = false
  }
}

function goBack() {
  navigateTo('/admin')
}
</script>
