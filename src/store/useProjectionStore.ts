import { create } from "zustand";

interface ProjectionStore {
    years: number;
    setYears: (years: number) => void;
}

export const useProjectionStore = create<ProjectionStore>((set) => ({
    years: 20,
    setYears: (years) => set({ years }),
}));
