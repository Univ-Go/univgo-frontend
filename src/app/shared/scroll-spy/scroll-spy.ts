import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ShellChrome } from '../shell-chrome/shell-chrome';

/**
 * The reading band: the top 30% of what the chrome leaves visible. A section counts as reached once
 * it crosses into that band, not while it only peeks in at the bottom of the screen.
 */
const READING_BAND_BOTTOM = '-70%';

/**
 * What releases a section jumped to: the person moving the page themselves. Not `scrollend`, which
 * the jump's own scroll fires too and would release the pin the moment it landed.
 */
const RELEASE_EVENTS = ['wheel', 'touchstart', 'keydown'] as const;

/**
 * The section being read: of those crossing the reading band, the last in page order — the one that
 * has just come up into it, rather than the tail of the previous one still on its way out. With none
 * in the band — a long section whose top has scrolled away — the previous answer stands, so the
 * highlight never blinks off mid-read.
 */
export function activeSection(
  order: readonly string[],
  visible: ReadonlySet<string>,
  previous: string | null,
): string | null {
  return [...order].reverse().find((id) => visible.has(id)) ?? previous;
}

/**
 * Level 1: which of a page's sections the person is reading, for a table of contents to highlight,
 * and the jump from that table to a section.
 *
 * Provided by the page that owns the table, not in root: two pages with a table each must not share
 * one notion of "current". Sections register through `ScrollSpySection` from wherever they are
 * rendered — the page itself or a component inside it — because they reach this through the element
 * injector, not through the page's view queries.
 *
 * A section jumped to stays the answer until the person moves again. The last sections of a page are
 * often too short to scroll to the top, so they would never enter the reading band, and the entry
 * just pressed would light up the one above it instead.
 */
@Injectable()
export class ScrollSpy {
  private readonly chrome = inject(ShellChrome);
  private readonly sections = new Map<HTMLElement, string>();
  private readonly visible = new Set<string>();
  private observer: IntersectionObserver | undefined;
  private pinned: string | null = null;

  public readonly active = signal<string | null>(null);

  constructor() {
    // Rebuilt when the chrome changes height, which it does across breakpoints: the band is measured
    // from below the header, and a stale inset would count a section hidden under it as read.
    effect((onCleanup) => {
      const observer = new IntersectionObserver((entries) => this.observe(entries), {
        rootMargin: `${-this.chrome.insetBlockStart()}px 0px ${READING_BAND_BOTTOM} 0px`,
      });

      this.sections.forEach((_, element) => observer.observe(element));
      this.observer = observer;

      onCleanup(() => observer.disconnect());
    });

    const release = (): void => {
      if (this.pinned !== null) {
        this.pinned = null;
        this.settle();
      }
    };

    RELEASE_EVENTS.forEach((type) =>
      document.addEventListener(type, release, { capture: true, passive: true }),
    );

    inject(DestroyRef).onDestroy(() =>
      RELEASE_EVENTS.forEach((type) =>
        document.removeEventListener(type, release, { capture: true }),
      ),
    );
  }

  public register(id: string, element: HTMLElement): void {
    this.sections.set(element, id);
    this.observer?.observe(element);

    if (this.active() === null) {
      this.active.set(id);
    }
  }

  public unregister(element: HTMLElement): void {
    const id = this.sections.get(element);

    this.sections.delete(element);
    this.observer?.unobserve(element);

    if (id !== undefined) {
      this.visible.delete(id);
    }
  }

  /**
   * `offset` is whatever the page itself keeps stuck over its content — a table of contents pinned
   * under the header on a phone — on top of the shell's own chrome, which this already discounts.
   */
  public jumpTo(id: string, offset = 0): void {
    const element = [...this.sections].find(([, sectionId]) => sectionId === id)?.[0];

    if (!element) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.pinned = id;
    this.active.set(id);

    element.style.scrollMarginBlockStart = `calc(${this.chrome.insetBlockStart() + offset}px + var(--univgo-space-m))`;
    element.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
    // The jump has to land somewhere for a keyboard or screen reader user too, not only scroll.
    element.focus({ preventScroll: true });
  }

  private observe(entries: readonly IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const id = this.sections.get(entry.target as HTMLElement);

      if (id === undefined) {
        continue;
      }

      if (entry.isIntersecting) {
        this.visible.add(id);
      } else {
        this.visible.delete(id);
      }
    }

    if (this.pinned === null) {
      this.settle();
    }
  }

  private settle(): void {
    this.active.set(activeSection(this.documentOrder(), this.visible, this.active()));
  }

  private documentOrder(): string[] {
    return [...this.sections]
      .sort(([a], [b]) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      )
      .map(([, id]) => id);
  }
}

/**
 * Marks one section of a page with a `ScrollSpy`. The id is also the element's `id`, so the section
 * has a fragment a link could point at, and `tabindex="-1"` lets a jump hand it focus without adding
 * it to the tab order.
 */
@Directive({
  selector: '[appScrollSpySection]',
  host: {
    '[id]': 'appScrollSpySection()',
    tabindex: '-1',
  },
})
export class ScrollSpySection {
  public readonly appScrollSpySection = input.required<string>();

  constructor() {
    const spy = inject(ScrollSpy);
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    afterNextRender(() => spy.register(this.appScrollSpySection(), element));
    inject(DestroyRef).onDestroy(() => spy.unregister(element));
  }
}
