/** True when the app was launched from an installed home-screen experience. */
export function isStandalonePwa(displayModeStandalone: boolean, iosStandalone: boolean): boolean {
  return displayModeStandalone || iosStandalone
}
