<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-6xl mx-auto mb-8" role="banner">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Compra de tickets
          </h1>
          <p class="text-slate-600">
            Selecciona un cine para ver las funciones disponibles y compra tus boletos en línea.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <Button
            icon="pi pi-refresh"
            label="Actualizar funciones"
            severity="secondary"
            text
            :loading="showtimesLoading"
            :disabled="!selectedCinemaId || showtimesLoading"
            @click="refetchShowtimes"
          />
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto space-y-6" role="main">
      <div
        v-if="!authenticated"
        class="rounded-xl border border-slate-200 bg-white shadow p-8 text-center text-slate-600 space-y-3"
      >
        <i class="pi pi-lock text-3xl text-slate-400" aria-hidden="true"></i>
        <h2 class="text-lg font-semibold text-slate-900">Inicia sesión</h2>
        <p>Necesitas iniciar sesión para comprar tickets.</p>
        <NuxtLink to="/login">
          <Button label="Ir a iniciar sesión" icon="pi pi-sign-in" />
        </NuxtLink>
      </div>

      <div
        v-else-if="!clientId"
        class="rounded-xl border border-amber-200 bg-amber-50 shadow p-8 text-center text-amber-700 space-y-3"
      >
        <i class="pi pi-exclamation-triangle text-3xl" aria-hidden="true"></i>
        <h2 class="text-lg font-semibold">No encontramos tu identificador de cliente.</h2>
        <p>Comunícate con soporte para completar tu registro antes de comprar tickets.</p>
      </div>

      <div v-else class="space-y-6">
        <section class="rounded-xl border border-slate-200 bg-white shadow p-6 sm:p-8 space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
            <div class="space-y-3">
              <label class="block text-sm font-medium text-slate-700" for="cinema">
                Cine *
              </label>
              <Dropdown
                id="cinema"
                v-model="selectedCinemaId"
                :options="cinemaOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona un cine"
                class="w-full"
                :loading="cinemasLoading"
                :disabled="cinemasLoading || !cinemaOptions.length"
                filter
              />
              <small v-if="errors.cinema" class="text-red-600">{{ errors.cinema }}</small>
              <p v-if="!cinemaOptions.length && !cinemasLoading" class="text-xs text-slate-500">
                No hay cines disponibles en este momento.
              </p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm text-slate-600">
              <p>
                Selecciona un cine y luego ajusta la cantidad de boletos por función en la lista inferior.
              </p>
              <p>
                Una vez confirmes la compra, los boletos se agregarán a tu historial en
                <NuxtLink to="/mis-compras" class="text-primary-600 hover:underline font-medium">Mis compras</NuxtLink>.
              </p>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-slate-900">Funciones disponibles</h2>
              <p class="text-sm text-slate-600">
                Ajusta la cantidad de boletos que deseas comprar por cada función.
              </p>
            </div>
            <span v-if="selectedCinemaId && !showtimesLoading" class="text-sm text-slate-600">
              {{ showtimes.length }}
              {{ showtimes.length === 1 ? "función" : "funciones" }} encontradas
            </span>
          </header>

          <div
            v-if="showtimesLoading"
            class="rounded-xl border border-slate-200 bg-white shadow p-12 text-center text-slate-600 space-y-3"
          >
            <i class="pi pi-spinner pi-spin text-3xl mb-3" aria-hidden="true"></i>
            <p>Cargando funciones del cine seleccionado…</p>
          </div>

          <div
            v-else-if="showtimesError"
            class="rounded-xl border border-red-200 bg-red-50 shadow p-8 text-center text-red-700 space-y-3"
          >
            <i class="pi pi-times-circle text-3xl" aria-hidden="true"></i>
            <h3 class="text-lg font-semibold">No se pudieron cargar las funciones.</h3>
            <p>{{ showtimesError }}</p>
            <Button
              icon="pi pi-refresh"
              label="Intentar nuevamente"
              severity="danger"
              outlined
              @click="refetchShowtimes"
            />
          </div>

          <div
            v-else-if="!selectedCinemaId"
            class="rounded-xl border border-slate-200 bg-white shadow p-12 text-center text-slate-600 space-y-3"
          >
            <i class="pi pi-eye text-3xl text-slate-400" aria-hidden="true"></i>
            <p>Selecciona un cine para visualizar sus funciones.</p>
          </div>

          <div
            v-else-if="!showtimes.length"
            class="rounded-xl border border-slate-200 bg-white shadow p-12 text-center text-slate-600 space-y-3"
          >
            <i class="pi pi-calendar-times text-3xl text-slate-400" aria-hidden="true"></i>
            <p>Este cine no tiene funciones activas por ahora.</p>
          </div>

          <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article
              v-for="showtime in showtimes"
              :key="showtime.id"
              class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              <div class="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">
                    {{ movieById(showtime.cinemaMovie?.movieId)?.title ?? "Función sin título" }}
                  </h3>
                  <p class="text-xs text-slate-300">
                    Sala {{ showtime.hall?.name ?? "N/D" }} · Capacidad {{ hallCapacity(showtime) }}
                  </p>
                </div>
                <Tag
                  :value="ticketsAvailable(showtime)"
                  severity="info"
                  rounded
                />
              </div>
              <div class="p-5 space-y-4 text-sm text-slate-600 flex-1 flex flex-col">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <p class="font-semibold text-slate-700 uppercase text-xs tracking-wide">
                      Inicio
                    </p>
                    <p class="text-slate-900 font-medium">
                      {{ formatDateTime(showtime.startTime) }}
                    </p>
                  </div>
                  <div>
                    <p class="font-semibold text-slate-700 uppercase text-xs tracking-wide">
                      Fin
                    </p>
                    <p class="text-slate-900 font-medium">
                      {{ formatDateTime(showtime.endTime) }}
                    </p>
                  </div>
                </div>
                <div class="mt-auto">
                  <label class="block text-sm font-medium text-slate-700 mb-2" :for="`qty-${showtime.id}`">
                    Cantidad de boletos
                  </label>
                  <InputNumber
                    :inputId="`qty-${showtime.id}`"
                    v-model="ticketQuantities[showtime.id]"
                    :min="0"
                    :max="showtime.ticketsAvailable ?? undefined"
                    :step="1"
                    :minFractionDigits="0"
                    :maxFractionDigits="0"
                    showButtons
                    buttonLayout="horizontal"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus"
                    class="w-full"
                    :disabled="submitting"
                  />
                </div>
              </div>
            </article>
          </div>

          <small v-if="errors.tickets" class="block text-red-600">
            {{ errors.tickets }}
          </small>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white shadow p-6 sm:p-8 space-y-6">
          <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-slate-900">Resumen de compra</h2>
              <p class="text-sm text-slate-600">
                Verifica la información antes de confirmar tus boletos.
              </p>
            </div>
            <div class="text-sm text-slate-600">
              Total de boletos: <span class="font-semibold text-slate-900">{{ totalTickets }}</span>
            </div>
          </header>

          <div v-if="selectedTicketDetails.length" class="space-y-4">
            <div
              v-for="detail in selectedTicketDetails"
              :key="detail.showtimeId"
              class="rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-600"
            >
              <div>
                <p class="text-base font-semibold text-slate-900">
                  {{ detail.movieTitle }}
                </p>
                <p class="text-xs text-slate-500">
                  Función {{ detail.showtimeId }} · Sala {{ detail.hallName }} · {{ detail.schedule }}
                </p>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-xs text-slate-500">
                  Boletos seleccionados
                </div>
                <div class="text-lg font-semibold text-slate-900">
                  {{ detail.quantity }}
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-slate-500">
            Selecciona al menos una función y define la cantidad de boletos para continuar.
          </p>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <Button
              type="button"
              label="Limpiar selección"
              severity="secondary"
              outlined
              :disabled="submitting || !selectedTicketDetails.length"
              @click="resetSelection"
            />
            <Button
              type="button"
              icon="pi pi-check"
              label="Confirmar compra"
              :loading="submitting"
              :disabled="submitDisabled"
              @click="handleSubmit"
            />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import InputNumber from "primevue/inputnumber";
import Tag from "primevue/tag";
import { toast } from "vue-sonner";
import { useAuthStore } from "~/stores/auth";
import { useCustomQuery } from "~/composables/useCustomQuery";
import {
  getAllCinemas,
  type CinemaResponseDTO,
} from "~/lib/api/cinema/cinema";
import {
  getShowtimesByCinema,
  type ShowtimeResponseDTO,
} from "~/lib/api/cinema/showtime";
import { getMoviesByIds, type MovieResponseDTO } from "~/lib/api/movies/movie";
import { createSale } from "~/lib/api/ventas/sales";

const authStore = useAuthStore();
const { authenticated, user } = storeToRefs(authStore);

const clientId = computed(() => user.value?.userId ?? "");

const {
  state: cinemasState,
  asyncStatus: cinemasStatus,
} = useCustomQuery({
  key: ["tickets-cinemas"],
  query: () => getAllCinemas(),
});

const cinemas = computed<CinemaResponseDTO[]>(() => {
  const data = cinemasState.value.data as CinemaResponseDTO[] | undefined;
  return data ?? [];
});

const cinemaOptions = computed<Array<{ label: string; value: string }>>(() =>
  cinemas.value.map((cinema) => ({
    label: cinema.name,
    value: cinema.id,
  }))
);

const cinemasLoading = computed(() => cinemasStatus.value === "loading");

const selectedCinemaId = ref<string>("")

watch(cinemas, (value) => {
  if (!value.length) {
    selectedCinemaId.value = "";
    return;
  }
  if (!selectedCinemaId.value || !value.some((cinema) => cinema.id === selectedCinemaId.value)) {
    selectedCinemaId.value = value[0].id;
  }
}, { immediate: true });

const {
  state: showtimesState,
  asyncStatus: showtimesStatus,
  refetch: refetchShowtimes,
} = useCustomQuery({
  key: ["tickets-showtimes", () => selectedCinemaId.value],
  query: async () => {
    const id = selectedCinemaId.value;
    if (!id) return [];
    return getShowtimesByCinema(id);
  },
});

const showtimes = computed<ShowtimeResponseDTO[]>(() => {
  const data = showtimesState.value.data as ShowtimeResponseDTO[] | undefined;
  return data ?? [];
});

const showtimesLoading = computed(() => showtimesStatus.value === "loading");
const showtimesError = computed(() => {
  const error = showtimesState.value.error as Error | undefined;
  return error?.message ?? null;
});

const ticketQuantities = reactive<Record<string, number>>({});

watch(showtimes, (items) => {
  const current = new Set(Object.keys(ticketQuantities));
  for (const showtime of items) {
    if (typeof ticketQuantities[showtime.id] !== "number") {
      ticketQuantities[showtime.id] = 0;
    }
    current.delete(showtime.id);
  }
  for (const key of current) {
    delete ticketQuantities[key];
  }
}, { immediate: true });

watch(selectedCinemaId, (value) => {
  for (const key of Object.keys(ticketQuantities)) {
    delete ticketQuantities[key];
  }
  if (value) {
    nextTick(() => {
      refetchShowtimes();
    });
  }
});

const movieIds = computed(() => {
  const ids = new Set<string>();
  for (const showtime of showtimes.value) {
    const movieId = showtime.cinemaMovie?.movieId;
    if (movieId) ids.add(movieId);
  }
  return Array.from(ids);
});

const movieIdsKey = computed(() => {
  if (!movieIds.value.length) return "empty";
  return [...movieIds.value].sort().join("|");
});

const {
  state: moviesState,
} = useCustomQuery({
  key: ["tickets-movies", () => movieIdsKey.value],
  query: async () => {
    const ids = movieIds.value;
    if (!ids.length) return [];
    return getMoviesByIds(ids);
  },
});

const moviesById = computed(() => {
  const data = moviesState.value.data as MovieResponseDTO[] | undefined;
  const map = new Map<string, MovieResponseDTO>();
  if (data) {
    for (const movie of data) {
      map.set(movie.id, movie);
    }
  }
  return map;
});

const errors = reactive({
  cinema: null as string | null,
  tickets: null as string | null,
});

watch(selectedCinemaId, () => {
  errors.cinema = null;
});

const selectedTickets = computed(() =>
  Object.entries(ticketQuantities)
    .filter(([, qty]) => typeof qty === "number" && qty > 0)
    .map(([showtimeId, quantity]) => ({
      showtimeId,
      quantity,
    }))
);

watch(selectedTickets, () => {
  errors.tickets = null;
});

const selectedTicketDetails = computed(() =>
  selectedTickets.value.map((item) => {
    const showtime = showtimes.value.find((st) => st.id === item.showtimeId);
    const movieId = showtime?.cinemaMovie?.movieId ?? "";
    const movie = movieId ? moviesById.value.get(movieId) : null;
    const start = showtime?.startTime ? formatDateTime(showtime.startTime) : "—";
    const end = showtime?.endTime ? formatDateTime(showtime.endTime) : "—";
    return {
      showtimeId: item.showtimeId,
      quantity: item.quantity,
      movieTitle: movie?.title ?? "Función sin título",
      hallName: showtime?.hall?.name ?? "N/D",
      schedule: `${start} - ${end}`,
    };
  })
);

const totalTickets = computed(() =>
  selectedTickets.value.reduce((total, item) => total + item.quantity, 0)
);

const submitting = ref(false);

const submitDisabled = computed(() => {
  if (submitting.value) return true;
  if (!selectedCinemaId.value) return true;
  if (!selectedTickets.value.length) return true;
  return false;
});

function hallCapacity(showtime: ShowtimeResponseDTO) {
  const hall = showtime.hall;
  if (!hall) return "—";
  if (typeof hall.rows === "number" && typeof hall.columns === "number") {
    return hall.rows * hall.columns;
  }
  return "—";
}

function ticketsAvailable(showtime: ShowtimeResponseDTO) {
  if (typeof showtime.ticketsAvailable !== "number") {
    return "Sin dato";
  }
  return `${showtime.ticketsAvailable} disp.`;
}

function movieById(id?: string | null) {
  if (!id) return null;
  return moviesById.value.get(id) ?? null;
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-GT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resetSelection() {
  for (const key of Object.keys(ticketQuantities)) {
    ticketQuantities[key] = 0;
  }
}

async function handleSubmit() {
  errors.cinema = selectedCinemaId.value ? null : "Selecciona un cine.";
  errors.tickets = selectedTickets.value.length
    ? null
    : "Selecciona al menos una función y define la cantidad de boletos.";

  if (errors.cinema || errors.tickets) {
    toast.error("Revisa los campos obligatorios antes de continuar.");
    return;
  }

  const id = clientId.value?.trim();
  if (!id) {
    toast.error("No se encontró tu identificador de cliente.");
    return;
  }

  submitting.value = true;
  try {
    const ticketsPayload = selectedTickets.value.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        cinemaFunctionId: item.showtimeId,
      }))
    );

    if (!ticketsPayload.length) {
      toast.error("Selecciona al menos un boleto para continuar.");
      submitting.value = false;
      return;
    }

    await createSale({
      clientId: id,
      cinemaId: selectedCinemaId.value,
      tickets: ticketsPayload,
      snacks: [],
    });

    toast.success("¡Compra registrada! Puedes revisar tus boletos en Mis compras.");
    resetSelection();
  } catch (error: any) {
    const message =
      error?.data?.message ??
      error?.message ??
      "No se pudo completar la compra. Intenta nuevamente.";
    toast.error(message);
  } finally {
    submitting.value = false;
  }
}
</script>
