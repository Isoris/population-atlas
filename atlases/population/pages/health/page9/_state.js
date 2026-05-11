// pages/health/page9/_state.js
//
// Page9 hatchery-health _pageState. The page's heavy state actually lives
// in window.state._hatcheryHealth (matching the legacy contract so the
// verbatim JS keeps working unchanged); this _pageState exists for the
// canonical state-aware wrapper pattern.

export let _pageState = null;
export function _setActiveState(s) { _pageState = s; }
