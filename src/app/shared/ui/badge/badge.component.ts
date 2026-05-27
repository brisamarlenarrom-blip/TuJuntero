// Componente de etiqueta de estado reutilizable
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  // Variante de color
  @Input() variant: 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple' = 'gray';
  
  // Tamaño
  @Input() size: 'sm' | 'md' = 'md';
}