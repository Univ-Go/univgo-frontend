/**
 * jsdom implements no CSS Object Model media queries, but Taiga UI calls `matchMedia` while
 * bootstrapping: `TUI_BREAKPOINT` resolves the current layout from it and `TUI_DARK_MODE` reads
 * `prefers-color-scheme` from it. The stub reports "does not match", so components render their
 * wide, light layout under test.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
