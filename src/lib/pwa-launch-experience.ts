export type PwaLaunchExperienceMode = 'skip' | 'cinematic-fallback' | 'immersive'

export function getPwaLaunchExperienceMode(input: {
  standalone: boolean
  prefersReducedMotion: boolean
  webglAvailable: boolean
}): PwaLaunchExperienceMode {
  if (!input.standalone || input.prefersReducedMotion) return 'skip'
  return input.webglAvailable ? 'immersive' : 'cinematic-fallback'
}
