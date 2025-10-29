<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <!-- Header -->
    <header class="max-w-7xl mx-auto mb-6" role="banner">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin/companias">
            <Button
              icon="pi pi-arrow-left"
              label="Volver"
              size="small"
              aria-label="Volver al listado de compañías"
            />
          </RouterLink>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
            Crear compañía
          </h1>
        </div>
      </div>
    </header>

    <!-- Form -->
    <main class="max-w-4xl mx-auto" role="main">
      <div class="rounded-2xl border border-slate-200 bg-white shadow">
        <form class="p-6 sm:p-8 space-y-6" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label
                class="block text-sm font-medium text-slate-700 mb-2"
                for="name"
                >Nombre *</label
              >
              <InputText
                id="name"
                v-model.trim="form.name"
                class="w-full"
                autocomplete="off"
                placeholder="Ej. Distribuidora Centroamericana"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-slate-700 mb-2"
                for="address"
                >Dirección *</label
              >
              <Textarea
                id="address"
                v-model.trim="form.address"
                class="w-full"
                rows="3"
                autoResize
                placeholder="Ej. 5a Avenida 12-34, Zona 10, Ciudad de Guatemala"
              />
              <p v-if="errors.address" class="mt-1 text-sm text-red-600">
                {{ errors.address }}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-slate-700 mb-2"
                for="phone"
                >Teléfono *</label
              >
              <InputText
                id="phone"
                v-model.trim="form.phoneNumber"
                class="w-full"
                autocomplete="off"
                placeholder="Ej. 12345678"
                inputmode="numeric"
                maxlength="15"
              />
              <p v-if="errors.phoneNumber" class="mt-1 text-sm text-red-600">
                {{ errors.phoneNumber }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4">
            <RouterLink to="/admin/companias">
              <Button
                type="button"
                label="Cancelar"
                severity="secondary"
                outlined
              />
            </RouterLink>
            <Button
              type="submit"
              label="Crear compañía"
              icon="pi pi-save"
              :loading="submitting"
            />
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import { toast } from "vue-sonner";
import {
  createCompany,
  type SaveCompanyRequest,
} from "~/lib/api/company/company";

const router = useRouter();

const form = reactive<SaveCompanyRequest>({
  name: "",
  address: "",
  phoneNumber: "",
});

const errors = reactive<Record<keyof SaveCompanyRequest, string | null>>({
  name: null,
  address: null,
  phoneNumber: null,
});

const submitting = ref(false);

function validate() {
  errors.name =
    form.name.trim().length >= 2
      ? null
      : "El nombre debe tener al menos 2 caracteres.";
  errors.address =
    form.address.trim().length >= 5
      ? null
      : "La dirección debe tener al menos 5 caracteres.";
  const digits = form.phoneNumber.replace(/\D/g, "");
  if (!digits) {
    errors.phoneNumber = "Ingresa un número de teléfono.";
  } else if (digits.length < 8) {
    errors.phoneNumber = "El número debe tener al menos 8 dígitos.";
  } else {
    errors.phoneNumber = null;
  }
  return !errors.name && !errors.address && !errors.phoneNumber;
}

async function onSubmit() {
  if (!validate()) return;

  submitting.value = true;
  try {
    const payload: SaveCompanyRequest = {
      name: form.name.trim(),
      address: form.address.trim(),
      phoneNumber: form.phoneNumber.trim(),
    };
    const created = await createCompany(payload);
    toast.success("Compañía creada correctamente.");
    await router.push(`/admin/companias/${created.id}`);
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.message ||
      "No se pudo crear la compañía.";
    toast.error(message);
  } finally {
    submitting.value = false;
  }
}
</script>
