import { create } from 'zustand'

interface AppState {
  isLoading: boolean
  error: string | null
}

interface AppActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

interface Store extends AppState, AppActions {}

export const useStore = create<Store>((set) => ({
  // Initial state
  isLoading: false,
  error: null,

  // Actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
}))