import { defineComponent, h, nextTick } from 'vue'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useOnlineStatus } from '../useOnlineStatus'

function mountComposable() {
  let result!: ReturnType<typeof useOnlineStatus>
  const wrapper = mount(
    defineComponent({
      setup() {
        result = useOnlineStatus()
        return () => h('div')
      },
    }),
  )
  return { result: result!, wrapper }
}

describe('useOnlineStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reflects navigator.onLine on mount when online', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result, wrapper } = mountComposable()
    expect(result.isOnline.value).toBe(true)
    wrapper.unmount()
  })

  it('reflects navigator.onLine on mount when offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result, wrapper } = mountComposable()
    expect(result.isOnline.value).toBe(false)
    wrapper.unmount()
  })

  it('switches to false when the offline event fires', async () => {
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result, wrapper } = mountComposable()

    spy.mockReturnValue(false)
    window.dispatchEvent(new Event('offline'))
    await nextTick()

    expect(result.isOnline.value).toBe(false)
    wrapper.unmount()
  })

  it('switches to true when the online event fires', async () => {
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result, wrapper } = mountComposable()

    spy.mockReturnValue(true)
    window.dispatchEvent(new Event('online'))
    await nextTick()

    expect(result.isOnline.value).toBe(true)
    wrapper.unmount()
  })

  it('removes event listeners on unmount', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result, wrapper } = mountComposable()
    wrapper.unmount()

    // firing events after unmount must not update the ref
    window.dispatchEvent(new Event('offline'))
    await nextTick()
    expect(result.isOnline.value).toBe(true)
  })
})
