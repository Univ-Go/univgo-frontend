import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiAppearance, TuiButton, TuiIcon, TuiLink, TuiTitle } from '@taiga-ui/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader, TuiSurface } from '@taiga-ui/layout';

/** Shape of the sample data below. Real models will live in the feature's domain layer. */
interface FeaturedSpace {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly icon: string;
  readonly available: boolean;
  readonly tags: readonly string[];
}

/**
 * Visual mock: layout and component inventory are final, the data is not. Everything below is
 * sample content so the structure can be judged; it moves to a use case once the API exists.
 */
@Component({
  selector: 'app-home-page',
  imports: [
    TuiAppearance,
    TuiBadge,
    TuiButton,
    TuiCardLarge,
    TuiChip,
    TuiHeader,
    TuiIcon,
    TuiLink,
    TuiSurface,
    TuiTitle,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly userName = 'Mateo';

  protected readonly nextReservation = {
    name: 'Laboratorio de Innovación',
    location: 'Edificio C, Nivel 4',
    time: '14:00 – 16:00',
    date: '24 oct',
    icon: '@tui.flask-conical',
  };

  protected readonly featuredSpaces: readonly FeaturedSpace[] = [
    {
      id: 'court-a',
      name: 'Cancha de Básquetbol A',
      location: 'Complejo Deportivo Central, Zona Norte',
      icon: '@tui.volleyball',
      available: true,
      tags: ['Deportes', 'Luz natural'],
    },
    {
      id: 'makerspace',
      name: 'MakerSpace Lab',
      location: 'Edificio de Ingeniería, Piso 2',
      icon: '@tui.flask-conical',
      available: false,
      tags: ['Tecnología', 'Grupal'],
    },
    {
      id: 'court-b',
      name: 'Cancha de Básquetbol B',
      location: 'Complejo Deportivo Central, Zona Sur',
      icon: '@tui.dumbbell',
      available: true,
      tags: ['Deportes', 'Cubierto'],
    },
  ];
}
