// Circuit breaker for Airtable API calls
// Prevents cascading failures by short-circuiting requests when Airtable is unhealthy

export enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation - requests pass through
  OPEN = 'OPEN',           // Failing - requests are rejected immediately
  HALF_OPEN = 'HALF_OPEN', // Testing - one request allowed to probe health
}

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number;
  /** Milliseconds to wait before transitioning from OPEN → HALF_OPEN */
  resetTimeoutMs: number;
  /** Optional name for logging */
  name: string;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000, // 30 seconds
  name: 'airtable',
};

export class CircuitBreakerError extends Error {
  constructor(name: string) {
    super(`[CircuitBreaker:${name}] Circuit is OPEN - request rejected`);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private failureCount = 0;
  private rejectedCount = 0;
  private lastStateChange = Date.now();
  readonly config: CircuitBreakerConfig;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getState(): CircuitState {
    // Check if we should transition OPEN → HALF_OPEN
    if (
      this.state === CircuitState.OPEN &&
      Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs
    ) {
      this.transitionTo(CircuitState.HALF_OPEN);
    }
    return this.state;
  }

  getStats() {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      totalSuccesses: this.successCount,
      totalFailures: this.failureCount,
      totalRejected: this.rejectedCount,
      lastFailureTime: this.lastFailureTime || null,
      lastStateChange: this.lastStateChange,
      config: { ...this.config },
    };
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitBreakerError if the circuit is OPEN.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === CircuitState.OPEN) {
      this.rejectedCount++;
      throw new CircuitBreakerError(this.config.name);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  /** Record a successful call */
  private onSuccess(): void {
    this.successCount++;
    this.consecutiveFailures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      // First success in HALF_OPEN → close the circuit
      this.transitionTo(CircuitState.CLOSED);
    }
  }

  /** Record a failed call */
  private onFailure(): void {
    this.failureCount++;
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Failure in HALF_OPEN → reopen immediately
      this.transitionTo(CircuitState.OPEN);
    } else if (
      this.state === CircuitState.CLOSED &&
      this.consecutiveFailures >= this.config.failureThreshold
    ) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;
    console.warn(
      `[CircuitBreaker:${this.config.name}] ${this.state} → ${newState}`
    );
    this.state = newState;
    this.lastStateChange = Date.now();
  }

  /** Force-reset to CLOSED (e.g., for admin/health-check use) */
  reset(): void {
    this.consecutiveFailures = 0;
    this.transitionTo(CircuitState.CLOSED);
  }
}

// Singleton circuit breaker for the Airtable integration
export const airtableCircuitBreaker = new CircuitBreaker({
  name: 'airtable',
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
});
