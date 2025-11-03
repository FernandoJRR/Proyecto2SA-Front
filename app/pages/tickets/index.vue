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
            :loading="showtimesLoading || seatsOccupiedLoading"
            :disabled="!selectedCinemaId || showtimesLoading || seatsOccupiedLoading"
            @click="refreshShowtimesAndAvailability"
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
              @click="refreshShowtimesAndAvailability"
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

          <div v-else class="space-y-5">
            <div
              v-if="seatsOccupiedErrorMessage"
              class="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm p-4 text-sm text-amber-700"
            >
              {{ seatsOccupiedErrorMessage }} Intenta actualizar las funciones.
            </div>

            <div
              v-if="activeShowtime && activeShowtimeId"
              class="rounded-2xl border border-slate-200 bg-white shadow overflow-hidden"
            >
              <div class="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-medium text-primary-600 uppercase tracking-wide">
                    Configurar boletos
                  </p>
                  <h3 class="text-xl font-semibold text-slate-900">
                    {{ activeShowtimeMovie?.title ?? "Función sin título" }}
                  </h3>
                  <p class="text-sm text-slate-600">
                    Define cuántos boletos deseas para esta función.
                  </p>
                </div>
                <Tag
                  :value="activeShowtime ? showtimeAvailabilityLabel(activeShowtime) : 'Sin dato'"
                  :severity="activeShowtime && isShowtimeSoldOut(activeShowtime.id) ? 'danger' : 'info'"
                  rounded
                />
              </div>
              <div class="px-6 py-6 space-y-5">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
                  <div>
                    <span class="block text-xs uppercase tracking-wide text-slate-500">Sala</span>
                    <span class="font-semibold text-slate-900">
                      {{ activeShowtime?.hall?.name ?? "N/D" }}
                    </span>
                    <span class="block text-xs text-slate-500">
                      Capacidad {{ activeShowtime ? hallCapacity(activeShowtime) : "—" }}
                    </span>
                  </div>
                  <div>
                    <span class="block text-xs uppercase tracking-wide text-slate-500">Horario</span>
                    <span class="font-semibold text-slate-900">
                      {{ activeShowtime ? formatDateTime(activeShowtime.startTime) : "—" }}
                    </span>
                    <span class="block text-xs text-slate-500">
                      Termina: {{ activeShowtime ? formatDateTime(activeShowtime.endTime) : "—" }}
                    </span>
                  </div>
                  <div>
                    <span class="block text-xs uppercase tracking-wide text-slate-500">Disponibles</span>
                    <span
                      class="font-semibold"
                      :class="activeAvailability?.soldOut ? 'text-red-600' : 'text-slate-900'"
                    >
                      {{ activeShowtime ? showtimeAvailabilityLabel(activeShowtime) : "Sin dato" }}
                    </span>
                    <span
                      v-if="activeShowtime && showtimeOccupancyLabel(activeShowtime)"
                      class="block text-xs text-slate-500"
                    >
                      {{ showtimeOccupancyLabel(activeShowtime) }}
                    </span>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="block text-sm font-medium text-slate-700" for="active-quantity">
                    Cantidad de boletos
                  </label>
                  <InputNumber
                    id="active-quantity"
                    v-model="activeQuantity"
                    :min="0"
                    :max="activeMaxTickets"
                    :step="1"
                    :minFractionDigits="0"
                    :maxFractionDigits="0"
                    showButtons
                    buttonLayout="horizontal"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus"
                    class="w-full sm:w-56"
                    :disabled="submitting || activeAvailability?.soldOut"
                  />
                  <p
                    v-if="activeAvailability?.soldOut"
                    class="text-xs font-semibold text-red-600"
                  >
                    Función agotada. No hay boletos disponibles.
                  </p>
                </div>

                <div class="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    label="Cancelar"
                    severity="secondary"
                    outlined
                    :disabled="submitting"
                    @click="cancelSelection"
                  />
                  <Button
                    type="button"
                    icon="pi pi-check"
                    label="Guardar cantidad"
                    :disabled="submitting || activeAvailability?.soldOut"
                    @click="confirmQuantity"
                  />
                </div>
              </div>
            </div>

            <div
              v-else
              class="rounded-2xl border border-slate-200 bg-white shadow overflow-hidden"
            >
              <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">Selecciona una función</h3>
                  <p class="text-sm text-slate-600">
                    Elige una función para definir la cantidad de boletos.
                  </p>
                </div>
                <span class="text-sm text-slate-500">
                  {{ showtimes.length }} {{ showtimes.length === 1 ? "función" : "funciones" }} disponibles
                </span>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                  <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left">Película</th>
                      <th scope="col" class="px-6 py-3 text-left">Sala</th>
                      <th scope="col" class="px-6 py-3 text-left">Horario</th>
                      <th scope="col" class="px-6 py-3 text-left">Disponibles</th>
                      <th scope="col" class="px-6 py-3 text-left">Precio</th>
                      <th scope="col" class="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-white text-sm">
                    <tr
                      v-for="showtime in showtimes"
                      :key="showtime.id"
                      :class="isShowtimeSoldOut(showtime.id) ? 'bg-slate-50 text-slate-500' : ''"
                    >
                      <td class="px-6 py-4 align-top">
                        <div class="font-semibold text-slate-900">
                          {{ movieById(showtime.cinemaMovie?.movieId)?.title ?? "Función sin título" }}
                        </div>
                        <div class="text-xs text-slate-500">
                          Función {{ showtime.id }}
                        </div>
                        <div
                          v-if="movieById(showtime.cinemaMovie?.movieId)?.classification?.name"
                          class="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                        >
                          {{ movieById(showtime.cinemaMovie?.movieId)?.classification?.name }}
                        </div>
                      </td>
                      <td class="px-6 py-4 align-top">
                        <div class="font-medium text-slate-900">
                          {{ showtime.hall?.name ?? "N/D" }}
                        </div>
                        <div class="text-xs text-slate-500">
                          Capacidad {{ hallCapacity(showtime) }}
                        </div>
                      </td>
                      <td class="px-6 py-4 align-top">
                        <div class="font-medium text-slate-900">
                          {{ formatDateTime(showtime.startTime) }}
                        </div>
                        <div class="text-xs text-slate-500">
                          Termina: {{ formatDateTime(showtime.endTime) }}
                        </div>
                      </td>
                      <td class="px-6 py-4 align-top">
                        <Tag
                          :value="showtimeAvailabilityLabel(showtime)"
                          :severity="isShowtimeSoldOut(showtime.id) ? 'danger' : 'info'"
                          rounded
                        />
                        <div
                          v-if="showtimeOccupancyLabel(showtime)"
                          class="mt-1 text-xs text-slate-500"
                        >
                          {{ showtimeOccupancyLabel(showtime) }}
                        </div>
                      </td>
                      <td class="px-6 py-4 align-top">
                        <div class="font-medium text-slate-900">
                          {{ formatCurrency(showtime.price) }}
                        </div>
                      </td>
                      <td class="px-6 py-4 align-top text-right">
                        <Button
                          size="small"
                          icon="pi pi-ticket"
                          label="Seleccionar"
                          :disabled="isShowtimeSoldOut(showtime.id)"
                          @click="selectShowtime(showtime.id)"
                        />
                        <p
                          v-if="ticketQuantities[showtime.id] > 0"
                          class="mt-2 text-xs text-slate-500"
                        >
                          Seleccionados: {{ ticketQuantities[showtime.id] }}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
            <div class="text-sm text-slate-600 text-right space-y-1">
              <div>
                Total de boletos:
                <span class="font-semibold text-slate-900">{{ totalTickets }}</span>
              </div>
              <div>
                Total estimado:
                <span class="font-semibold text-slate-900">{{ formatCurrency(ticketsTotalAmount) }}</span>
              </div>
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
                <p class="text-xs text-slate-500">
                  Precio: {{ formatCurrency(detail.price) }} · Subtotal: {{ formatCurrency(detail.lineTotal) }}
                </p>
              </div>
              <div class="flex flex-col items-start sm:items-end text-right gap-1">
                <div class="text-xs text-slate-500">Boletos seleccionados</div>
                <div class="text-lg font-semibold text-slate-900">
                  {{ detail.quantity }}
                </div>
                <div class="text-xs text-slate-500">Subtotal</div>
                <div class="text-lg font-semibold text-slate-900">
                  {{ formatCurrency(detail.lineTotal) }}
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
import { getQuantitySeatsOccupied } from "~/lib/api/ventas/tickets";

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

const showtimeIds = computed(() =>
  showtimes.value.map((item) => item.id).filter(Boolean)
);

const showtimeIdsKey = computed(() => {
  if (!showtimeIds.value.length) return "empty";
  return [...showtimeIds.value].sort().join("|");
});

const {
  state: seatsOccupiedState,
  asyncStatus: seatsOccupiedStatus,
  refetch: refetchSeatsOccupied,
} = useCustomQuery({
  key: ["tickets-showtimes-occupied", () => showtimeIdsKey.value],
  query: async () => {
    const ids = showtimeIds.value;
    if (!ids.length) return {};
    try {
      const responses = await Promise.all(
        ids.map(async (id) => {
          const { quantity } = await getQuantitySeatsOccupied(id);
          return [id, quantity] as const;
        })
      );
      return Object.fromEntries(responses);
    } catch (error: any) {
      const message =
        error?.data?.message ??
        error?.message ??
        "No se pudo obtener la disponibilidad actualizada.";
      throw new Error(message);
    }
  },
});

const seatsOccupiedData = computed<Record<string, number>>(() => {
  const data = seatsOccupiedState.value.data as
    | Record<string, number>
    | undefined;
  return data ?? {};
});

const seatsOccupiedLoading = computed(
  () => seatsOccupiedStatus.value === "loading"
);

const seatsOccupiedErrorMessage = computed(() => {
  const maybeError = seatsOccupiedState.value.error as
    | { message?: string }
    | undefined;
  if (!maybeError) return null;
  return (
    maybeError.message ??
    "No se pudo obtener la disponibilidad actualizada de las funciones."
  );
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
  refetch: refetchMovies,
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

const showtimesMap = computed(() => {
  const map = new Map<string, ShowtimeResponseDTO>();
  for (const showtime of showtimes.value) {
    map.set(showtime.id, showtime);
  }
  return map;
});

const showtimesAvailability = computed(() => {
  const map = new Map<
    string,
    {
      total: number | null;
      occupied: number;
      available: number | null;
      soldOut: boolean;
    }
  >();
  for (const showtime of showtimes.value) {
    const hall = showtime.hall;
    const hallCapacity =
      hall &&
      typeof hall.rows === "number" &&
      typeof hall.columns === "number"
        ? hall.rows * hall.columns
        : null;
    const totalSeats =
      typeof showtime.ticketsAvailable === "number"
        ? showtime.ticketsAvailable
        : hallCapacity;
    const occupied =
      typeof seatsOccupiedData.value[showtime.id] === "number"
        ? Math.max(seatsOccupiedData.value[showtime.id], 0)
        : 0;
    const available =
      typeof totalSeats === "number"
        ? Math.max(totalSeats - occupied, 0)
        : null;
    map.set(showtime.id, {
      total: typeof totalSeats === "number" ? totalSeats : null,
      occupied,
      available,
      soldOut: typeof available === "number" ? available <= 0 : false,
    });
  }
  return map;
});

const activeShowtimeId = ref<string | null>(null);
const activeQuantity = ref<number>(0);

const activeShowtime = computed(() => {
  const id = activeShowtimeId.value;
  if (!id) return null;
  return showtimesMap.value.get(id) ?? null;
});

const activeShowtimeMovie = computed(() => {
  const showtime = activeShowtime.value;
  const movieId = showtime?.cinemaMovie?.movieId;
  if (!movieId) return null;
  return moviesById.value.get(movieId) ?? null;
});

const activeAvailability = computed(() => {
  const id = activeShowtimeId.value;
  if (!id) return null;
  return availabilityForShowtime(id);
});

const activeMaxTickets = computed(() => {
  const id = activeShowtimeId.value;
  if (!id) return undefined;
  return maxTicketsForShowtime(id);
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
  if (
    activeShowtimeId.value &&
    !items.some((showtime) => showtime.id === activeShowtimeId.value)
  ) {
    cancelSelection();
  }
}, { immediate: true });

watch(
  showtimeIdsKey,
  (value, previous) => {
    if (value === previous) return;
    if (value === "empty") return;
    refetchSeatsOccupied();
  },
  { immediate: false }
);

watch(
  selectedCinemaId,
  (value) => {
    activeShowtimeId.value = null;
    activeQuantity.value = 0;
    for (const key of Object.keys(ticketQuantities)) {
      delete ticketQuantities[key];
    }
    if (value) {
      nextTick(() => {
        refreshShowtimesAndAvailability();
        if (movieIdsKey.value !== "empty") {
          refetchMovies();
        }
      });
    }
  },
  { immediate: true }
);

watch(
  movieIdsKey,
  (value, previous) => {
    if (value === previous) return;
    if (value === "empty") return;
    refetchMovies();
  },
  { immediate: false }
);

watch(activeShowtimeId, (id) => {
  if (!id) {
    activeQuantity.value = 0;
    return;
  }
  const current = Number(ticketQuantities[id] ?? 0);
  activeQuantity.value =
    Number.isFinite(current) && current >= 0 ? current : 0;
});

watch(
  activeAvailability,
  (info) => {
    if (!info) return;
    if (info.soldOut) {
      activeQuantity.value = 0;
      return;
    }
    if (
      typeof info.available === "number" &&
      activeQuantity.value > info.available
    ) {
      activeQuantity.value = info.available;
    }
  },
  { immediate: false }
);

watch(
  () => Array.from(showtimesAvailability.value.entries()),
  (entries) => {
    for (const [showtimeId, info] of entries) {
      if (!(showtimeId in ticketQuantities)) continue;
      const current = Number(ticketQuantities[showtimeId] ?? 0);
      if (!Number.isFinite(current) || current <= 0) continue;
      if (info.soldOut) {
        ticketQuantities[showtimeId] = 0;
        continue;
      }
      if (
        typeof info.available === "number" &&
        current > info.available
      ) {
        ticketQuantities[showtimeId] = info.available;
      }
    }
  },
  { immediate: true }
);

const errors = reactive({
  cinema: null as string | null,
  tickets: null as string | null,
});

watch(selectedCinemaId, () => {
  errors.cinema = null;
});

const selectedTickets = computed(() =>
  Object.entries(ticketQuantities)
    .filter(([showtimeId, qty]) => {
      const quantity = Number(qty);
      if (!showtimesMap.value.has(showtimeId)) return false;
      if (!Number.isFinite(quantity) || quantity <= 0) return false;
      const availability = showtimesAvailability.value.get(showtimeId);
      if (availability?.soldOut) return false;
      if (
        availability &&
        typeof availability.available === "number" &&
        quantity > availability.available
      ) {
        return false;
      }
      return true;
    })
    .map(([showtimeId, quantity]) => ({
      showtimeId,
      quantity: Number(quantity),
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
    const price =
      typeof showtime?.price === "number" && !Number.isNaN(showtime.price)
        ? showtime.price
        : 0;
    return {
      showtimeId: item.showtimeId,
      quantity: item.quantity,
      movieTitle: movie?.title ?? "Función sin título",
      hallName: showtime?.hall?.name ?? "N/D",
      schedule: `${start} - ${end}`,
      price,
      lineTotal: price * item.quantity,
    };
  })
);

const totalTickets = computed(() =>
  selectedTickets.value.reduce((total, item) => total + item.quantity, 0)
);

const ticketsTotalAmount = computed(() =>
  selectedTicketDetails.value.reduce(
    (total, detail) => total + detail.lineTotal,
    0
  )
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

function availabilityForShowtime(showtimeId: string) {
  return showtimesAvailability.value.get(showtimeId) ?? null;
}

function showtimeAvailabilityLabel(showtime: ShowtimeResponseDTO) {
  const info = availabilityForShowtime(showtime.id);
  if (!info) {
    return seatsOccupiedLoading.value ? "Calculando…" : "Sin dato";
  }
  if (info.soldOut) return "Agotada";
  if (typeof info.available === "number") {
    return `${info.available} disp.`;
  }
  return seatsOccupiedLoading.value ? "Calculando…" : "Sin dato";
}

function showtimeOccupancyLabel(showtime: ShowtimeResponseDTO) {
  const info = availabilityForShowtime(showtime.id);
  if (!info) return null;
  if (typeof info.total === "number") {
    return `${info.occupied}/${info.total} ocupados`;
  }
  return `Ocupados: ${info.occupied}`;
}

function isShowtimeSoldOut(showtimeId: string) {
  return availabilityForShowtime(showtimeId)?.soldOut ?? false;
}

function maxTicketsForShowtime(showtimeId: string) {
  const info = availabilityForShowtime(showtimeId);
  if (info && typeof info.available === "number") {
    return info.available;
  }
  const showtime = showtimesMap.value.get(showtimeId);
  if (
    showtime &&
    typeof showtime.ticketsAvailable === "number" &&
    showtime.ticketsAvailable >= 0
  ) {
    return showtime.ticketsAvailable;
  }
  return undefined;
}

function selectShowtime(showtimeId: string) {
  if (!showtimesMap.value.has(showtimeId)) return;
  if (isShowtimeSoldOut(showtimeId)) return;
  activeShowtimeId.value = showtimeId;
}

function cancelSelection() {
  activeShowtimeId.value = null;
  activeQuantity.value = 0;
}

function confirmQuantity() {
  const showtimeId = activeShowtimeId.value;
  if (!showtimeId) return;
  const availability = availabilityForShowtime(showtimeId);
  if (availability?.soldOut) {
    delete ticketQuantities[showtimeId];
    activeShowtimeId.value = null;
    activeQuantity.value = 0;
    toast.error("Esta función ya no tiene boletos disponibles.");
    return;
  }
  let quantity = Number(activeQuantity.value);
  if (!Number.isFinite(quantity) || quantity < 0) {
    quantity = 0;
  }
  const max = maxTicketsForShowtime(showtimeId);
  if (typeof max === "number" && quantity > max) {
    quantity = max;
    activeQuantity.value = max;
    toast.warning("Se ajustó la cantidad al máximo disponible.");
  }

  if (quantity <= 0) {
    delete ticketQuantities[showtimeId];
  } else {
    ticketQuantities[showtimeId] = quantity;
  }

  activeShowtimeId.value = null;
  activeQuantity.value = 0;
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

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Q0.00";
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(value);
}

async function refreshShowtimesAndAvailability() {
  await Promise.all([refetchShowtimes(), refetchSeatsOccupied()]);
}

function resetSelection() {
  activeShowtimeId.value = null;
  activeQuantity.value = 0;
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
    await refreshShowtimesAndAvailability();
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
