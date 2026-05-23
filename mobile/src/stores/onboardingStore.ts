/**
 * Onboarding store — in-memory only ferry for the child egg-hatch flow.
 *
 * Used by the screens at app/(child)/onboarding/* to pass the chosen
 * species + name between the species → name → hatch steps. Cleared after
 * a successful hatch (or when the child logs out). Deliberately NOT
 * persisted; if the child force-quits mid-onboarding they'll just start
 * the story again (which is fine for a 4-frame intro).
 */
import { create } from 'zustand';
import type { CreatureSpecies } from '@/api/creatures.api';

interface OnboardingState {
  selectedSpecies: CreatureSpecies | null;
  selectedName: string | null;
  setSpecies: (species: CreatureSpecies) => void;
  setName: (name: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  selectedSpecies: null,
  selectedName: null,
  setSpecies: (species) => set({ selectedSpecies: species }),
  setName: (name) => set({ selectedName: name }),
  reset: () => set({ selectedSpecies: null, selectedName: null }),
}));
