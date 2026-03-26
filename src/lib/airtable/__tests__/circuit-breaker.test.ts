import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitState,
  CircuitBreakerError,
} from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 3,
      resetTimeoutMs: 100, // short for testing
    });
  });

  it('starts in CLOSED state', () => {
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('passes through successful calls in CLOSED state', async () => {
    const result = await cb.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('stays CLOSED after failures below threshold', async () => {
    for (let i = 0; i < 2; i++) {
      await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow('fail');
    }
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('opens after consecutive failures reach threshold', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow('fail');
    }
    expect(cb.getState()).toBe(CircuitState.OPEN);
  });

  it('rejects immediately when OPEN', async () => {
    // Trip the breaker
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }

    await expect(cb.execute(() => Promise.resolve('ok'))).rejects.toThrow(
      CircuitBreakerError
    );
  });

  it('transitions to HALF_OPEN after resetTimeout', async () => {
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }
    expect(cb.getState()).toBe(CircuitState.OPEN);

    // Wait for reset timeout
    await new Promise((r) => setTimeout(r, 150));
    expect(cb.getState()).toBe(CircuitState.HALF_OPEN);
  });

  it('closes on first success in HALF_OPEN', async () => {
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }

    await new Promise((r) => setTimeout(r, 150));
    expect(cb.getState()).toBe(CircuitState.HALF_OPEN);

    await cb.execute(() => Promise.resolve('ok'));
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('reopens on failure in HALF_OPEN', async () => {
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }

    await new Promise((r) => setTimeout(r, 150));
    expect(cb.getState()).toBe(CircuitState.HALF_OPEN);

    await cb.execute(() => Promise.reject(new Error('fail again'))).catch(() => {});
    expect(cb.getState()).toBe(CircuitState.OPEN);
  });

  it('resets consecutive failures on success', async () => {
    // 2 failures, then 1 success resets counter
    await cb.execute(() => Promise.reject(new Error('f1'))).catch(() => {});
    await cb.execute(() => Promise.reject(new Error('f2'))).catch(() => {});
    await cb.execute(() => Promise.resolve('ok'));

    // 2 more failures should not open (counter was reset)
    await cb.execute(() => Promise.reject(new Error('f3'))).catch(() => {});
    await cb.execute(() => Promise.reject(new Error('f4'))).catch(() => {});
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('tracks stats correctly', async () => {
    await cb.execute(() => Promise.resolve('ok'));
    await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});

    const stats = cb.getStats();
    expect(stats.totalSuccesses).toBe(1);
    expect(stats.totalFailures).toBe(1);
    expect(stats.consecutiveFailures).toBe(1);
    expect(stats.state).toBe(CircuitState.CLOSED);
  });

  it('counts rejected calls when OPEN', async () => {
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }

    await cb.execute(() => Promise.resolve('ok')).catch(() => {});
    await cb.execute(() => Promise.resolve('ok')).catch(() => {});

    const stats = cb.getStats();
    expect(stats.totalRejected).toBe(2);
  });

  it('reset() force-closes the circuit', async () => {
    for (let i = 0; i < 3; i++) {
      await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }
    expect(cb.getState()).toBe(CircuitState.OPEN);

    cb.reset();
    expect(cb.getState()).toBe(CircuitState.CLOSED);

    // Should allow calls again
    const result = await cb.execute(() => Promise.resolve('recovered'));
    expect(result).toBe('recovered');
  });
});
