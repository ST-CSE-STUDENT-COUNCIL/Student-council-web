import { create } from 'zustand'

type SystemState = {
    isMaintenance: boolean
    setMaintenance: (value: boolean) => void
}

export const useSystemStore = create<SystemState>((set) => ({
    isMaintenance: false,
    setMaintenance: (value) => set({ isMaintenance: value }),
}))
