function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export const $api = $fetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  onRequest({ options }) {
    const userAuth = getCookie(AUTH_COOKIE_NAME)
    options.headers.set('Authorization', userAuth ? `Bearer ${userAuth}` : '')
  },
  async onResponseError({ response }) {
    const errorData = await response._data
    console.error('API Error:', response)

    throw createError({
      statusCode: response.status,
      message: errorData?.message || 'Ha ocurrido un error'
    })
  },
  async onRequestError({ request }) {
    console.error('API Error:', request)

    throw createError({
      message: 'Ha ocurrido un error'
    })
  }
})

/**
 * Cliente para multipart/form-data.
 * Importante: NO establecer manualmente el 'Content-Type'.
 * El navegador agregará el boundary correctamente cuando el body sea FormData.
 */
export const $apiMultipart = $fetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  onRequest({ options }) {
    const userAuth = getCookie(AUTH_COOKIE_NAME)
    // No seteamos 'Content-Type' aquí. Solo Authorization.
    options.headers.set('Authorization', userAuth ? `Bearer ${userAuth}` : '')
  },
  async onResponseError({ response }) {
    const errorData = await response._data
    console.error('API Error (multipart):', response)

    throw createError({
      statusCode: response.status,
      message: errorData?.message || 'Ha ocurrido un error al subir datos'
    })
  },
  async onRequestError({ request }) {
    console.error('API Error (multipart):', request)

    throw createError({
      message: 'Ha ocurrido un error al preparar la solicitud'
    })
  }
})


export const genParams = (objectParams: any): string => {
  if (!objectParams) return "";
  const params = new URLSearchParams();
  Object.entries(objectParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const query = params.toString();
  return query ? "?" + query : "";
};

/**
 * Crea un FormData genérico a partir de un objeto plano.
 * - Arrays: hace append por cada elemento con la MISMA llave (key[]= no es necesario, depende del backend).
 * - Files/Blobs: se agregan directamente.
 * - null/undefined: se omiten.
 */
export const toFormData = (payload: Record<string, any>): FormData => {
  const fd = new FormData()
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== null && v !== undefined) fd.append(key, v as any)
      })
    } else {
      fd.append(key, value as any)
    }
  })
  return fd
}