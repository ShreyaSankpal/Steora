/*
 * Bounded fetch helper.
 *
 * Every outbound request from the travel-plan pipeline is wrapped
 * in a hard timeout so a stalled or unreachable provider cannot
 * hang the request handler indefinitely.
 *
 * A single shared AbortController is used per call. The controller
 * is aborted on timeout, and the resulting AbortError is converted
 * into a descriptive Error so callers can fail cleanly.
 */

export interface FetchWithTimeoutOptions {
  timeoutMs: number;
  signal?: AbortSignal;
}

export class FetchTimeoutError extends Error {
  readonly _tag = "fetch-timeout";

  constructor(message: string) {
    super(message);
    this.name = "FetchTimeoutError";
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  options: FetchWithTimeoutOptions
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs
  );

  const { signal, dispose } = combineSignals(
    controller.signal,
    options.signal
  );

  try {
    return await fetch(input, {
      ...init,
      signal,
    });
  } catch (error) {
    if (
      controller.signal.aborted &&
      error instanceof DOMException &&
      (error.name === "AbortError" ||
        error.name === "TimeoutError")
    ) {
      throw new FetchTimeoutError(
        `Request timed out after ${options.timeoutMs} ms.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    dispose();
  }
}

function combineSignals(
  primary: AbortSignal,
  secondary?: AbortSignal
): { signal: AbortSignal; dispose: () => void } {
  if (!secondary) {
    return { signal: primary, dispose: () => {} };
  }

  if (secondary.aborted) {
    return {
      signal: secondary,
      dispose: () => {},
    };
  }

  const combined = new AbortController();
  const cleanup: (() => void)[] = [];

  const propagate = () => {
    if (!combined.signal.aborted) {
      combined.abort(secondary.reason);
    }
  };

  secondary.addEventListener("abort", propagate, {
    once: true,
  });

  cleanup.push(() =>
    secondary.removeEventListener("abort", propagate)
  );

  const onPrimaryAbort = () => {
    if (!combined.signal.aborted) {
      combined.abort(primary.reason);
    }
  };

  primary.addEventListener("abort", onPrimaryAbort, {
    once: true,
  });

  cleanup.push(() =>
    primary.removeEventListener("abort", onPrimaryAbort)
  );

  return {
    signal: combined.signal,
    dispose: () => {
      for (const remove of cleanup) {
        remove();
      }
    },
  };
}