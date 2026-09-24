// src/hooks/useAutoRepeat.ts
// Botão que repete enquanto está pressionado, acelerando (ex.: +/− dias).
import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';

export function useAutoRepeat(action: () => void, { delay = 380, start = 150, min = 55 } = {}) {
  const actionRef = useRef(action);
  actionRef.current = action;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      actionRef.current();
      let interval = start;
      const tick = () => {
        actionRef.current();
        interval = Math.max(min, interval * 0.86);
        timer.current = setTimeout(tick, interval);
      };
      stop();
      timer.current = setTimeout(tick, delay);
    },
    [delay, start, min, stop],
  );

  // teclado (Enter/Espaço) gera click com detail 0; o ponteiro já foi tratado
  const onClick = useCallback((e: MouseEvent<HTMLElement>) => {
    if (e.detail === 0) actionRef.current();
  }, []);

  return { onPointerDown, onPointerUp: stop, onPointerCancel: stop, onLostPointerCapture: stop, onClick };
}
