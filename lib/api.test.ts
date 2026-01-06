/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { apiClient } from './api'

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      defaults: {
        baseURL: 'http://localhost:8000/api',
      },
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}))

describe('API Client', () => {
  it('should initialize with correct base URL', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:8000/api')
  })

  it('should handle successful GET request', async () => {
    const mockData = { message: 'success' }
    ;(apiClient.get as any).mockResolvedValueOnce({ data: mockData })

    const result = await apiClient.get('/test')
    expect(result.data).toEqual(mockData)
    expect(apiClient.get).toHaveBeenCalledWith('/test')
  })

  it('should handle POST request', async () => {
    const mockData = { id: 1 }
    const payload = { name: 'test' }
    ;(apiClient.post as any).mockResolvedValueOnce({ data: mockData })

    const result = await apiClient.post('/test', payload)
    expect(result.data).toEqual(mockData)
    expect(apiClient.post).toHaveBeenCalledWith('/test', payload)
  })

  it('should handle request errors', async () => {
    const errorMessage = 'Network Error'
    ;(apiClient.get as any).mockRejectedValueOnce(new Error(errorMessage))

    await expect(apiClient.get('/test')).rejects.toThrow(errorMessage)
  })
})