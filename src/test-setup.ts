/**
 * jsdom implements no CSS Object Model media queries, but PrimeNG components that adapt to a
 * breakpoint (Menubar, Toast) call `matchMedia` on init. The stub reports "does not match", so
 * components render their wide layout under test.
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
