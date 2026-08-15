import type { Routes } from '@angular/router';

/**
 * Empty while the real views are built: the bootstrap pages were removed along with PrimeNG. Every
 * new route declares `title` and `data.description`, which `PageMetadataStrategy` turns into
 * document metadata, so that no page can ship without a title.
 */
export const routes: Routes = [];
