/**
 * useCreatureEmotion — derives a single EmotionState from creature state.
 *
 * Rules (source: plans/demo-flow.md §3.4 happiness band + Polish-A spec):
 *   - recentEvent in last 5s ∈ {FED, VERIFIED, EVOLVED} → EXCITED for 4s.
 *   - night/away (local 22:00–06:00) → SLEEPING.
 *   - happiness < 30 → SAD.
 *   - happiness ≥ 30 → HAPPY (keep the demo feeling positive).
 *
 * Exposes a `triggerEvent(kind)` callback so optimistic UI (e.g. feed-care
 * item press) can pop the creature into EXCITED without waiting for the
 * server roundtrip.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EmotionState } from '@/constants/creatureSpec';

export type CreatureRecentEvent = 'FED' | 'VERIFIED' | 'EVOLVED';

interface UseCreatureEmotionInput {
  happiness: number;
  lastFedAt?: string | null;
  pendingCareItemCount?: number;
  /** Most recent transient event from the API/optimistic path. */
  recentEvent?: CreatureRecentEvent | null;
}

const EXCITED_LATCH_MS = 4000;

function isNightLocal(now = new Date()): boolean {
  const hr = now.getHours();
  return hr >= 22 || hr < 6;
}

export function useCreatureEmotion(input: UseCreatureEmotionInput): EmotionState & string {
  const { happiness, recentEvent } = input;
  const [excitedUntil, setExcitedUntil] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Latch EXCITED for EXCITED_LATCH_MS on any incoming recent event.
  useEffect(() => {
    if (!recentEvent) return;
    setExcitedUntil(Date.now() + EXCITED_LATCH_MS);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setExcitedUntil(0);
    }, EXCITED_LATCH_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [recentEvent]);

  const emotion = useMemo<EmotionState>(() => {
    if (excitedUntil > Date.now()) return 'EXCITED';
    if (isNightLocal()) return 'SLEEPING';
    if (happiness < 30) return 'SAD';
    return 'HAPPY';
  }, [excitedUntil, happiness]);

  return emotion as EmotionState & string;
}

/**
 * Manual-trigger variant for callers that want to ping EXCITED on click
 * (e.g. care-item tap) without driving state through a prop change.
 *
 * Returns:
 *   - emotion: current derived emotion (same rules as useCreatureEmotion).
 *   - triggerEvent: function to latch EXCITED for 4s.
 */
export function useCreatureEmotionWithTrigger(input: Omit<UseCreatureEmotionInput, 'recentEvent'>) {
  const [eventTick, setEventTick] = useState<CreatureRecentEvent | null>(null);
  const emotion = useCreatureEmotion({ ...input, recentEvent: eventTick });

  const triggerEvent = useCallback((kind: CreatureRecentEvent) => {
    // Setting to a new object-ish value would refire, but useEffect inside
    // useCreatureEmotion is keyed on recentEvent identity — toggling to
    // null then to kind on the next tick guarantees a fresh latch.
    setEventTick(null);
    setTimeout(() => setEventTick(kind), 0);
  }, []);

  return { emotion, triggerEvent };
}
