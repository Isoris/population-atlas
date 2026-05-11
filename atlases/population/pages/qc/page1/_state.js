// pages/qc/page1/_state.js
//
// State module for the Population Atlas page1 samples scaffold. Mirrors the
// Inversion / Genome Atlas pageN/_state.js shape exactly — same exports, same
// purpose. _pageState is page1-private (distinct ref from any other page).

export let _pageState = null;
export function _setActiveState(s) { _pageState = s; }
