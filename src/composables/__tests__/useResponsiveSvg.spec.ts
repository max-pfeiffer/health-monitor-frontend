import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { makeSvgResponsive, useResponsiveSvg } from '../useResponsiveSvg'

describe('makeSvgResponsive', () => {
  it('returns an empty string for empty input', () => {
    expect(makeSvgResponsive('')).toBe('')
    expect(makeSvgResponsive(null)).toBe('')
    expect(makeSvgResponsive(undefined)).toBe('')
  })

  it('derives a viewBox from width/height and strips them', () => {
    const out = makeSvgResponsive(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect /></svg>',
    )
    expect(out).toContain('viewBox="0 0 800 400"')
    expect(out).not.toMatch(/\bwidth=/)
    expect(out).not.toMatch(/\bheight=/)
    expect(out).toContain('preserveAspectRatio="xMidYMid meet"')
  })

  it('keeps an existing viewBox', () => {
    const out = makeSvgResponsive(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="200" height="100"></svg>',
    )
    expect(out).toContain('viewBox="0 0 100 50"')
    expect(out).not.toMatch(/\bwidth=/)
  })

  it('preserves inner markup', () => {
    const out = makeSvgResponsive(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle r="5"/></svg>',
    )
    expect(out).toContain('<circle')
    expect(out).toContain('r="5"')
  })

  it('returns the raw markup when it is not valid SVG', () => {
    expect(makeSvgResponsive('not svg')).toBe('not svg')
  })
})

describe('useResponsiveSvg', () => {
  it('reacts to source changes', () => {
    const source = ref('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"></svg>')
    const result = useResponsiveSvg(source)
    expect(result.value).toContain('viewBox="0 0 40 20"')

    source.value = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30"></svg>'
    expect(result.value).toContain('viewBox="0 0 60 30"')
  })
})
