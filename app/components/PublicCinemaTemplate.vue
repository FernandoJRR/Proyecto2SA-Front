<script setup lang="ts">
import { Comment, computed, useSlots } from 'vue'

const slots = useSlots()

const hasSlotContent = (slotName: string) => {
  const slot = slots[slotName]
  if (!slot) {
    return false
  }

  return slot().some((vnode) => vnode.type !== Comment)
}

const hasLeftAds = computed(() => hasSlotContent('left-ads'))
const hasRightAds = computed(() => hasSlotContent('right-ads'))

const gridClasses = computed(() => {
  const classes = ['grid', 'gap-6', 'xl:items-start', 'xl:justify-center']

  if (hasLeftAds.value && hasRightAds.value) {
    classes.push('xl:grid-cols-[220px_minmax(0,640px)_220px]')
  } else if (hasLeftAds.value) {
    classes.push('xl:grid-cols-[220px_minmax(0,1fr)]')
  } else if (hasRightAds.value) {
    classes.push('xl:grid-cols-[minmax(0,1fr)_220px]')
  } else {
    classes.push('xl:grid-cols-1')
  }

  return classes
})

const mainClasses = computed(() => {
  const classes = ['space-y-10', 'w-full', 'xl:w-full']

  if (hasLeftAds.value || hasRightAds.value) {
    classes.push('xl:max-w-[640px]')
  }

  return classes
})
</script>

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

      <div :class="gridClasses">
        <aside v-if="$slots['left-ads']" class="hidden xl:block">
          <div class="sticky top-24 space-y-4">
            <slot name="left-ads" />
          </div>
        </aside>

        <main :class="mainClasses" role="main">
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
