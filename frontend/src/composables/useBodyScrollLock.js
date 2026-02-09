import { watch, onUnmounted } from 'vue'

export function useBodyScrollLock(isLocked) {
  const originalOverflow = document.body.style.overflow
  const originalPaddingRight = document.body.style.paddingRight

  watch(isLocked, (locked) => {
    if (locked) {
      // Get scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      
      // Lock scroll
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // Unlock scroll
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, { immediate: true })

  onUnmounted(() => {
    // Cleanup
    document.body.style.overflow = originalOverflow
    document.body.style.paddingRight = originalPaddingRight
  })
}
