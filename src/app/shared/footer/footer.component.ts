// Importaciones para el Footer (barra inferior)
import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';  // Barra de Material
import { MatIconButton } from '@angular/material/button';      // Botón de ícono
import { RouterModule } from '@angular/router';                // Para navegar
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatToolbarModule, MatIconButton, RouterModule, MatIconModule,],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {}



