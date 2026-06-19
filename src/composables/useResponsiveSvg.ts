import { type MaybeRefOrGetter, computed, toValue } from 'vue'

/**
 * Rewrites a backend-rendered SVG so it scales to its container instead of
 * being fixed to the dimensions the backend baked in:
 *
 * - ensures a `viewBox` is present (derived from `width`/`height` when missing),
 * - strips the fixed `width`/`height` attributes so CSS can size the element,
 * - sets `preserveAspectRatio` so it scales without distortion.
 *
 * The actual responsive sizing is applied via CSS on the rendered `<svg>`.
 * Returns an empty string for empty input and the raw markup if it cannot be
 * parsed as SVG.
 */
export function makeSvgResponsive(raw: string | null | undefined): string {
  if (!raw) return ''
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml')
  const svg = doc.documentElement
  if (svg.nodeName !== 'svg' || doc.querySelector('parsererror')) return raw

  if (!svg.getAttribute('viewBox')) {
    const width = parseFloat(svg.getAttribute('width') ?? '')
    const height = parseFloat(svg.getAttribute('height') ?? '')
    if (Number.isFinite(width) && Number.isFinite(height)) {
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    }
  }

  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  return svg.outerHTML
}

/** Reactive wrapper around {@link makeSvgResponsive}. */
export function useResponsiveSvg(source: MaybeRefOrGetter<string | null | undefined>) {
  return computed(() => makeSvgResponsive(toValue(source)))
}
