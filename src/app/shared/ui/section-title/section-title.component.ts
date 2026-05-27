// Componente de título de sección reutilizable
import { Component } from '@angular/core';

@Component({
  selector: 'ui-section-title',
  standalone: true,
  template: '<h3 class="ui-section-title"><ng-content></ng-content></h3>',
  styleUrl: './section-title.component.css'
})
export class SectionTitleComponent {}