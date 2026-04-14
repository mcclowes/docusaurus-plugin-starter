export default {
  canUseDOM: typeof window !== 'undefined',
  canUseEventListeners: typeof window !== 'undefined',
  canUseIntersectionObserver: typeof window !== 'undefined',
  canUseViewport: typeof window !== 'undefined',
}
