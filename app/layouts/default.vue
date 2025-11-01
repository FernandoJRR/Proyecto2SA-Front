<template>
  <main class="min-h-screen bg-slate-50">
    <!-- Topbar with Menubar -->
    <header
      class="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur"
    >
      <div class="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <Menubar :model="menuModelBound" class="border-0 bg-transparent">
          <template #start>
            <div class="flex items-center gap-3 py-3">
              <Button
                icon="pi pi-bars"
                text
                class="lg:hidden"
                aria-label="Abrir menú"
                @click="mobileOpen = true"
              />
              <RouterLink to="/" class="flex items-center">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold"
                  >C</span
                >
                <span class="text-slate-900 font-extrabold tracking-tight"
                  >Cines</span
                >
              </RouterLink>
            </div>
          </template>
          <template #end>
            <div class="hidden lg:flex items-center">
              <RouterLink to="/profile" v-if="authenticated">
                <Button severity="secondary" variant="text"
                  ><i class="pi pi-user" /> Ver Perfil</Button
                >
              </RouterLink>
              <RouterLink to="/login" v-if="!authenticated">
                <Button variant="text"
                  ><i class="pi pi-sign-in" /> Iniciar Sesión</Button
                >
              </RouterLink>
              <Button variant="text" @click="logout" v-if="authenticated"
                ><i class="pi pi-sign-out" /> Cerrar Sesión</Button
              >
            </div>
          </template>
        </Menubar>
      </div>
    </header>

    <!-- Content: expanded width, pages handle their own cards -->
    <div class="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <!-- Breadcrumbs -->
      <div class="mb-4">
        <Breadcrumb
          :model="breadcrumbs"
          :home="homeCrumb"
          aria-label="Ruta actual"
        />
      </div>
      <!-- Page Outlet (no forced card wrapper) -->
      <NuxtPage />
    </div>

    <!-- Mobile Sidebar (only for mobile, not duplicated on desktop) -->
    <Sidebar
      v-model:visible="mobileOpen"
      class="lg:hidden"
      position="left"
      :modal="true"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold"
            >CD</span
          >
          <span class="text-slate-900 font-bold">Cine</span>
        </div>
      </template>

      <nav aria-label="Principal (móvil)">
        <ul class="space-y-1">
          <li>
            <RouterLink
              to="/"
              @click="mobileOpen = false"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <i class="pi pi-home" />
              <span>Inicio</span>
            </RouterLink>
          </li>
          <template
            v-for="menuItem in filterMenuModel(menuModel)"
            :key="menuItem.label"
          >
            <li v-if="menuItem.verticalBar" class="mt-1">
              <p
                class="px-3 py-2 text-xs uppercase tracking-wide text-slate-500"
              >
                {{ menuItem.label }}
              </p>
              <ul
                v-if="menuItem.items"
                class="ml-3 space-y-1 border-l border-slate-200 pl-3"
              >
                <li v-for="subItem in menuItem.items" :key="subItem.label">
                  <RouterLink
                    :to="subItem.to"
                    @click="mobileOpen = false"
                    class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <i :class="subItem.icon" /><span>{{ subItem.label }}</span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </template>
        </ul>
      </nav>
    </Sidebar>
  </main>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Sidebar from "primevue/sidebar";
import Breadcrumb from "primevue/breadcrumb";
import Menubar from "primevue/menubar";
import { AppRoles, hasAnyRole } from "~/lib/auth/roles";
import { LazyBreadcrumb } from "#components";

const authStore = useAuthStore();
const { logout } = authStore;
const { user, authenticated, rol: currentUserRole } = storeToRefs(authStore);

const route = useRoute();
const mobileOpen = ref(false);

function bindCommands(items: any[]): any[] {
  return (items || []).map((item) => {
    const next: any = { ...item };
    if (next.to) {
      next.command = () => navigateTo(next.to);
    }
    if (Array.isArray(next.items) && next.items.length) {
      next.items = bindCommands(next.items);
    }
    return next;
  });
}

const menuModelBound = computed(() => bindCommands(filterMenuModel(menuModel)));

function filterMenuModel(menuModel: any) {
  let filteredMenu = [];
  console.log("Current User Role:", currentUserRole.value);
  let access = hasAnyRole(currentUserRole.value, [
    AppRoles.ADMIN,
    AppRoles.CINEMA_ADMIN,
    AppRoles.CLIENT,
    null,
  ]);
  console.log("Access Check:", access);
  for (const item of menuModel) {
    if (!item.horizontalBar) {
      continue;
    }
    if (item.label === "Inicio") {
      filteredMenu.push(item);
      continue;
    }
    let validSubItems = [];
    for (const subItem of item.items || []) {
      if (subItem.accessRoles) {
        if (hasAnyRole(currentUserRole.value, subItem.accessRoles)) {
          validSubItems.push(subItem);
        }
      } else {
        validSubItems.push(subItem);
      }
    }
    if (validSubItems.length > 0) {
      filteredMenu.push({ ...item, items: validSubItems });
    }
  }
  return filteredMenu;
}

// Top Menubar model (supports nested menus)
const menuModel = [
  {
    horizontalBar: true,
    verticalBar: false,
    label: "Inicio",
    icon: "pi pi-home",
    to: "/",
  },
  {
    horizontalBar: true,
    verticalBar: true,
    label: "Entretenimiento",
    icon: "pi pi-film",
    items: [
      {
        label: "Cines",
        icon: "pi pi-building",
        to: "/cines",
        accessRoles: [
          AppRoles.ADMIN,
          AppRoles.CINEMA_ADMIN,
          AppRoles.CLIENT,
          null,
        ],
      },
      {
        label: "Peliculas",
        icon: "pi pi-verified",
        to: "/peliculas",
        accessRoles: [
          AppRoles.ADMIN,
          AppRoles.CINEMA_ADMIN,
          AppRoles.CLIENT,
          null,
        ],
      },
      {
        label: "Categorías",
        icon: "pi pi-tags",
        to: "/admin/categorias",
        accessRoles: [AppRoles.ADMIN],
      },
      {
        label: "Clasificaciones",
        icon: "pi pi-shield",
        to: "/admin/clasificaciones",
        accessRoles: [AppRoles.ADMIN],
      },
    ],
  },
  {
    horizontalBar: true,
    verticalBar: true,
    label: "Anuncios",
    icon: "pi pi-bullhorn",
    items: [
      {
        label: "Crear Anuncio",
        icon: "pi pi-plus-circle",
        to: "/anuncios/crear",
        accessRoles: [AppRoles.SPONSOR],
      },
      {
        label: "Mis Anuncios",
        icon: "pi pi-list",
        to: "/anuncios/mis-anuncios",
        accessRoles: [AppRoles.SPONSOR],
      },
    ],
  },
  {
    horizontalBar: true,
    verticalBar: true,
    label: "Compras",
    icon: "pi pi-shopping-bag",
    items: [
      {
        label: "Mis Compras",
        icon: "pi pi-tags",
        to: "/mis-compras",
        accessRoles: [AppRoles.CLIENT],
      },
      {
        label: "Tickets",
        icon: "pi pi-ticket",
        to: "/tickets",
        accessRoles: [AppRoles.CLIENT],
      },
    ],
  },
  {
    horizontalBar: true,
    verticalBar: true,
    label: "Ventas",
    icon: "pi pi-briefcase",
    items: [
      {
        label: "Crear Venta",
        icon: "pi pi-calendar",
        to: "/ventas",
        accessRoles: [AppRoles.CINEMA_ADMIN, AppRoles.ADMIN],
      },
    ],
  },
  {
    horizontalBar: true,
    verticalBar: true,
    label: "Administración",
    icon: "pi pi-cog",
    items: [
      {
        label: "Dashboard",
        icon: "pi pi-chart-line",
        to: "/admin",
        accessRoles: [AppRoles.ADMIN, AppRoles.CINEMA_ADMIN],
      },
    ],
  },
];

// Breadcrumbs
const homeCrumb = { icon: "pi pi-home", to: "/" };
const breadcrumbs = computed(() => {
  const items: any[] = [];
  for (const rec of route.matched) {
    if (!rec.path || rec.path === "/") continue;
    const label =
      (rec.meta as any)?.breadcrumb ||
      rec.name ||
      rec.path.split("/").filter(Boolean).slice(-1)[0];
    const to = rec.path.startsWith("/") ? rec.path : "/" + rec.path;
    items.push({ label, to });
  }
  return items;
});
</script>

<style scoped>
.p-menubar {
  padding: 0;
}

.p-sidebar {
  width: 18rem;
}
</style>
