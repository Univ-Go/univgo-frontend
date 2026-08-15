import type { Routes } from '@angular/router';

/**
 * Vacío mientras se construyen las vistas definitivas: las páginas del bootstrap se retiraron junto
 * con PrimeNG. Cada ruta nueva declara `title` y `data.description`, que `PageMetadataStrategy`
 * convierte en los metadatos del documento, de modo que ninguna página puede publicarse sin título.
 */
export const routes: Routes = [];
