/**
 * Mission timer store — persists per-assignment timer start time so the
 * countdown keeps running when the user navigates away from the mission
 * detail screen and comes back later.
 *
 * Only one assignment can be "active" at a time. Starting a new mission
 * automatically clears the previous one (mirrors a real focus timer).
 */
import { create } from 'zustand';

interface MissionTimerState {
  activeAssignmentId: string | null;
  startedAt: number | null; // epoch ms
  start: (assignmentId: string) => void;
  stop: () => void;
  isRunning: (assignmentId: string) => boolean;
  elapsedSeconds: (assignmentId: string) => number;
}

export const useMissionTimerStore = create<MissionTimerState>((set, get) => ({
  activeAssignmentId: null,
  startedAt: null,
  start: (assignmentId: string) => {
    set({ activeAssignmentId: assignmentId, startedAt: Date.now() });
  },
  stop: () => {
    set({ activeAssignmentId: null, startedAt: null });
  },
  isRunning: (assignmentId: string) => {
    const s = get();
    return s.activeAssignmentId === assignmentId && s.startedAt != null;
  },
  elapsedSeconds: (assignmentId: string) => {
    const s = get();
    if (s.activeAssignmentId !== assignmentId || s.startedAt == null) return 0;
    return Math.floor((Date.now() - s.startedAt) / 1000);
  },
}));
