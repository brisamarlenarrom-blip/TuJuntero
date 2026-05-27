// Componente de tarjeta reutilizable - Identidad visual de TuJuntero
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  // Color del borde izquierdo
  @Input() accent?: 'blue' | 'cyan' | 'green' | 'orange' | 'red' | 'purple';
  
  // Si es clickeable (hover + cursor pointer)
  @Input() clickable = false;
}