import { describe, it, expect } from 'vitest'
import { useStore } from './store'

describe('Store', () => {
  it('should initialize with default state', () => {
    const state = useStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should update loading state', () => {
    const { setLoading } = useStore.getState()
    setLoading(true)
    expect(useStore.getState().isLoading).toBe(true)

    setLoading(false)
    expect(useStore.getState().isLoading).toBe(false)
  })

  it('should set and clear error', () => {
    const { setError } = useStore.getState()
    const testError = 'Test error'

    setError(testError)
    expect(useStore.getState().error).toBe(testError)

    setError(null)
    expect(useStore.getState().error).toBeNull()
  })
})