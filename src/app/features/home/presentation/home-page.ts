import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';

interface BookingStep {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-home-page',
  imports: [Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.html',
})
export class HomePage {
  protected readonly steps: readonly BookingStep[] = [
    {
      icon: 'pi pi-building-columns',
      title: $localize`:@@home.steps.space.title:Elige un espacio`,
      description: $localize`:@@home.steps.space.description:Consulta las instalaciones deportivas y salas de estudio disponibles.`,
    },
    {
      icon: 'pi pi-clock',
      title: $localize`:@@home.steps.slot.title:Elige un horario`,
      description: $localize`:@@home.steps.slot.description:Comprueba la disponibilidad en tiempo real y selecciona la franja que te venga bien.`,
    },
    {
      icon: 'pi pi-check-circle',
      title: $localize`:@@home.steps.confirm.title:Confirma tu reserva`,
      description: $localize`:@@home.steps.confirm.description:Recibe la confirmación al instante y consulta tus reservas cuando quieras.`,
    },
  ];
}
