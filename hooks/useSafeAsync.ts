import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a function that checks if the component is still mounted.
 * Useful for preventing state updates on unmounted components.
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Creates a safe setState function that only updates state if the component is mounted.
 * Prevents "setState on unmounted component" warnings.
 */
export function useSafeState<T>(
  setState: React.Dispatch<React.SetStateAction<T>>
): React.Dispatch<React.SetStateAction<T>> {
  const isMounted = useIsMounted();

  return useCallback(
    (value: React.SetStateAction<T>) => {
      if (isMounted()) {
        setState(value);
      }
    },
    [isMounted, setState]
  );
}

/**
 * Hook for running async operations safely with automatic cancellation on unmount.
 * Returns a function to run async operations that will be cancelled if the component unmounts.
 */
export function useSafeAsync(): <T>(
  asyncFn: (signal: AbortSignal) => Promise<T>,
  onSuccess?: (result: T) => void,
  onError?: (error: Error) => void
) => void {
  const isMounted = useIsMounted();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return useCallback(
    <T>(
      asyncFn: (signal: AbortSignal) => Promise<T>,
      onSuccess?: (result: T) => void,
      onError?: (error: Error) => void
    ) => {
      // Cancel any existing operation
      abortControllerRef.current?.abort();

      // Create new abort controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      asyncFn(controller.signal)
        .then((result) => {
          if (isMounted() && !controller.signal.aborted) {
            onSuccess?.(result);
          }
        })
        .catch((error) => {
          if (isMounted() && !controller.signal.aborted) {
            // Don't call onError for abort errors
            if (error.name !== 'AbortError') {
              onError?.(error);
            }
          }
        });
    },
    [isMounted]
  );
}

/**
 * Hook that returns a callback wrapper that only executes if the component is still mounted.
 */
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const isMounted = useIsMounted();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (isMounted()) {
        return callback(...args);
      }
    }) as T,
    [isMounted, callback]
  );
}
