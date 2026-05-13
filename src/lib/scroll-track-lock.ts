let scrollTrackLockUntil = 0

export function lockScrollTrack(durationMs: number) {
  scrollTrackLockUntil = Math.max(scrollTrackLockUntil, Date.now() + durationMs)
}

export function isScrollTrackLocked() {
  return Date.now() < scrollTrackLockUntil
}
