// Componente de estado vacío reutilizable
import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  template: `
    <div class="ui-empty-state">
      <span class="ui-empty-state__icon">{{ icon }}</span>
      <p class="ui-empty-state__title">{{ title }}</p>
      <p class="ui-empty-state__text">{{ text }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'Sin resultados';
  @Input() text = 'Todavía no hay nada por aquí.';
}