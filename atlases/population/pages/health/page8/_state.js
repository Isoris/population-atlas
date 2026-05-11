// pages/health/page8/_state.js
//
// Page8 breeding-page _pageState. The page's heavy UI state actually lives
// in window.state._breedingPage (matching the legacy contract so the verbatim
// JS keeps working unchanged); this _pageState exists for the canonical
// state-aware wrapper pattern shared across the Atlas trio.

export let _pageState = null;
export function _setActiveState(s) { _pageState = s; }
