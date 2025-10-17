<template>
  <div class="flex justify-center items-center w-full h-full p-3">
    <!-- 🟦 YouTube -->
    <div
      v-if="isYouTube"
      class="w-full rounded-xl overflow-hidden shadow-md border border-slate-200"
      :class="
        ad.type === 'MEDIA_VERTICAL' ? 'max-w-sm aspect-[9/16]' : 'aspect-video'
      "
    >
      <iframe
        :src="youtubeEmbedUrl"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="w-full h-full"
      ></iframe>
    </div>

    <!-- 🟩 Imagen -->
    <div
      v-else-if="isImage"
      class="rounded-xl overflow-hidden shadow-md border border-slate-200 bg-black flex justify-center items-center"
      :class="
        ad.type === 'MEDIA_VERTICAL' ? 'max-w-sm aspect-[9/16]' : 'aspect-video'
      "
    >
      <img
        :src="ad.urlContent"
        alt="Anuncio"
        class="object-contain w-full h-full"
        loading="lazy"
      />
    </div>

    <!-- 🟥 Video (desde bucket o URL directa) -->
    <div
      v-else-if="isVideo"
      class="rounded-xl overflow-hidden shadow-md border border-slate-200 bg-black flex justify-center items-center"
      :class="
        ad.type === 'MEDIA_VERTICAL' ? 'max-w-sm aspect-[9/16]' : 'aspect-video'
      "
    >
      <video
        :src="ad.urlContent"
        controls
        class="w-full h-full object-contain"
        preload="metadata"
      ></video>
    </div>

    <!-- 🟨 Texto -->
    <div
      v-else
      class="p-5 bg-slate-50 border border-slate-200 rounded-xl shadow text-center max-w-2xl"
    >
      <p class="text-slate-800 whitespace-pre-wrap text-lg leading-relaxed">
        {{ ad.content || "Sin contenido textual" }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AnuncioViewResponseDTO } from "~/lib/api/anuncios/anuncio";

const props = defineProps<{
  ad: AnuncioViewResponseDTO;
}>();

// --- Computed type helpers ---
const isYouTube = computed(() => props.ad.contentType === "youtube");
const isImage = computed(() => props.ad.contentType?.startsWith("image/"));
const isVideo = computed(() => props.ad.contentType?.startsWith("video/"));

// --- Derived YouTube embed ---
const youtubeEmbedUrl = computed(() => {
  if (!props.ad.urlContent) return "";
  try {
    const match =
      props.ad.urlContent.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/) ||
      props.ad.urlContent.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
    const id = match?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : props.ad.urlContent;
  } catch {
    return props.ad.urlContent;
  }
});
</script>

<style scoped>
.aspect-video {
  aspect-ratio: 16 / 9;
}
.aspect-\[9\/16\] {
  aspect-ratio: 9 / 16;
}
</style>
