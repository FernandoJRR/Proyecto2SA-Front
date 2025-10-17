import { storeToRefs } from "pinia";
import { toast } from "vue-sonner";
import {
  canAccessAdmin,
  canAccessReservaciones,
  canAccessOrdenes,
  canAccessReportes,
  getRoleNameFromEmployee,
} from "~/lib/auth/roles";

export default defineNuxtRouteMiddleware((to, _from) => {
  //if (to.path === '/example') return

  //if(to.fullPath.includes('public')) return
  //if(to.fullPath.includes('juegos')) return

  const token = useCookie(AUTH_COOKIE_NAME);

  if (import.meta.client) {
    const auth = useAuthStore();
    const { employee, rol } = storeToRefs(auth);

    const role = rol.value ?? null;

    // Guard: only Admins can access routes under /admin
    if (to.path.startsWith("/admin") && !canAccessAdmin(role)) {
      toast.error("No tienes permisos para acceder a Administración");
      return navigateTo("/");
    }
    // /peliculas/editar, /peliculas/crear admin check
    if (
      (to.path.startsWith("/peliculas/editar") ||
        to.path.startsWith("/peliculas/crear")) &&
      !canAccessAdmin(role)
    ) {
      toast.error("No tienes permisos para acceder a Administración");
      return navigateTo("/peliculas");
    }

    // Guard: only Staff Hotel (or Admin) can access /reservaciones
    if (to.path.startsWith("/reservaciones") && !canAccessReservaciones(role)) {
      toast.error("No tienes permisos para acceder a Reservaciones");
      return navigateTo("/");
    }

    // Guard: only Staff Restaurante (or Admin) can access /ordenes
    if (to.path.startsWith("/ordenes") && !canAccessOrdenes(role)) {
      toast.error("No tienes permisos para acceder a Ordenes");
      return navigateTo("/");
    }

    // Guard: only Contador (or Admin) can access /reportes
    if (to.path.startsWith("/reportes") && !canAccessReportes(role)) {
      toast.error("No tienes permisos para acceder a Reportes");
      return navigateTo("/");
    }
  }
});
