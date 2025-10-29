<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title"
    :style="{ width: '80vw', maxWidth: '960px' }"
    :breakpoints="{ '960px': '95vw', '640px': '100vw' }"
  >
    <div v-if="pdfUrl" class="h-[70vh]">
      <iframe
        :src="pdfUrl"
        class="w-full h-full rounded-lg border border-slate-200"
        frameborder="0"
      ></iframe>
    </div>
    <div v-else class="py-12 text-center text-slate-500">
      No hay documento para mostrar.
    </div>
    <template #footer>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <span v-if="fileName" class="text-xs text-slate-500 truncate">{{
          fileName
        }}</span>
        <div class="flex items-center justify-end gap-2 w-full sm:w-auto">
          <Button
            icon="pi pi-download"
            label="Descargar"
            :disabled="!pdfUrl"
            @click="download"
          />
          <Button
            label="Cerrar"
            severity="secondary"
            outlined
            @click="close"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch, computed } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";

const props = defineProps<{
  modelValue: boolean;
  blob: Blob | null;
  title?: string;
  fileName?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const pdfUrl = ref<string | null>(null);

watch(
  () => props.blob,
  (blob) => {
    cleanupUrl();
    if (blob) {
      pdfUrl.value = URL.createObjectURL(blob);
    } else {
      pdfUrl.value = null;
    }
  },
  { immediate: true }
);

function cleanupUrl() {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = null;
  }
}

function download() {
  if (!pdfUrl.value) return;
  const link = document.createElement("a");
  link.href = pdfUrl.value;
  link.download = props.fileName || "documento.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function close() {
  visible.value = false;
}

onBeforeUnmount(() => {
  cleanupUrl();
});
</script>
