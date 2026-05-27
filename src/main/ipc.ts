// Strongly-typed IPC channels shared between main and preload. Renderer code
// only ever touches the wrapper API exposed by preload, never these strings.
export const IPC = {
  // Renderer → Main
  getSettings: 'apex:get-settings',
  setSettings: 'apex:set-settings',
  toggleOverlay: 'apex:toggle-overlay',
  triggerDeepAnalyze: 'apex:trigger-deep-analyze',
  searchPlayer: 'apex:search-player',
  getMapRotation: 'apex:get-map-rotation',
  setLegend: 'apex:set-legend',
  setMap: 'apex:set-map',
  // Main → Renderer (broadcasts)
  stateUpdate: 'apex:state-update',
  newTips: 'apex:new-tips',
  toastError: 'apex:toast-error'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
