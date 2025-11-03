<template>
  <div class="min-h-screen bg-slate-50 py-10">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
      <header v-if="$slots.header" class="mx-auto w-full max-w-5xl" role="banner">
        <slot name="header" />
      </header>

      <section
        v-if="$slots['top-ads']"
        class="mx-auto w-full max-w-5xl"
        aria-label="Publicidad destacada"
      >
        <slot name="top-ads" />
      </section>

      <div
        class="grid gap-6 xl:grid-cols-[220px_minmax(0,640px)_220px] xl:items-start xl:justify-center"
      >
        <aside v-if="$slots['left-ads']" class="hidden xl:block">
          <div class="sticky top-24 space-y-4">
            <slot name="left-ads" />
          </div>
        </aside>

        <main class="space-y-10 xl:max-w-[640px] xl:w-full" role="main">
          <slot />
        </main>

        <aside v-if="$slots['right-ads']" class="hidden xl:block">
          <div class="sticky top-24 space-y-4">
            <slot name="right-ads" />
          </div>
        </aside>
      </div>

      <section
        v-if="$slots['bottom-ads']"
        class="mx-auto w-full max-w-5xl"
        aria-label="Publicidad adicional"
      >
        <slot name="bottom-ads" />
      </section>
    </div>
  </div>
</template>
