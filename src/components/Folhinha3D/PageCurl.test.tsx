import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageCurl } from './PageCurl';

let frames: Map<number, FrameRequestCallback>;
let sequence: number;

beforeEach(() => {
  frames = new Map();
  sequence = 0;
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(400);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(500);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++sequence, callback);
    return sequence;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function frame(time: number) {
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach(callback => callback(time)));
}

describe('PageCurl', () => {
  it.each(['right', 'left'] as const)('dobra antes de sair e mantém o eixo no canto %s', corner => {
    const done = vi.fn();
    const { container } = render(<PageCurl corner={corner} duration={1000} onDone={done}>12</PageCurl>);
    const root = container.querySelector<HTMLElement>('.page-curl')!;
    const front = container.querySelector<HTMLElement>('.curl-front')!;
    const flap = container.querySelector<HTMLElement>('.curl-flap')!;
    // O primeiro quadro já deve estar preparado antes de o navegador pintar.
    expect(front.style.clipPath).toContain('polygon(');
    expect(root.style.transform).toBe('translate3d(0, 0px, 2px)');
    const initialFold = flap.style.transform;

    frame(500);
    expect(flap.style.transform).not.toBe(initialFold);
    expect(root.style.transform).toBe('translate3d(0, 0px, 2px)');
    expect(root.style.opacity).toBe('1');

    for (const time of [750, 850, 950]) {
      frame(time);
      const transform = root.style.transform.match(/^translate3d\(0, (-?[\d.]+)px, 2px\)$/);
      expect(transform).not.toBeNull();
      expect(Number(transform![1])).toBeLessThan(0);
      expect(flap.style.transform).not.toMatch(/NaN|Infinity/);
    }
    expect(done).not.toHaveBeenCalled();
    frame(1000);
    expect(root.style.opacity).toBe('0');
    expect(done).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it('cancela quadros pendentes ao desmontar', () => {
    const done = vi.fn();
    const { unmount } = render(<PageCurl corner="right" onDone={done}>12</PageCurl>);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    frame(2000);
    expect(done).not.toHaveBeenCalled();
  });

  it('respeita movimento reduzido sem calcular a dobra', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const done = vi.fn();
    render(<PageCurl corner="right" onDone={done}>12</PageCurl>);
    expect(frames.size).toBe(0);
    act(() => vi.advanceTimersByTime(220));
    expect(done).toHaveBeenCalledTimes(1);
  });
});
