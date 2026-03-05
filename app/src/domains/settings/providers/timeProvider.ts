export interface TimeProvider {
  now(): number;
}

export function createTimeProvider(): TimeProvider {
  return {
    now: () => Date.now()
  };
}
