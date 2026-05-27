// Importaciones para el Navbar
import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';   // Barra de Angular Material
import { MatButtonModule } from '@angular/material/button';     // Botones de Material
import { RouterModule, Router } from '@angular/router';         // Para navegar entre páginas
import { CommonModule } from '@angular/common';                 // Directivas *ngIf
import { AuthService } from '../../core/auth.service';          // Servicio de autenticación

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  
  // Inyecta AuthService (público para usarlo en el HTML) y Router
  constructor(public auth: AuthService, private router: Router) {}

  // Cierra la sesión y redirige al inicio
  logout() {
    this.auth.logout();                  // Limpia la sesión
    this.router.navigate(['/inicio']);   // Vuelve al inicio
  }
}