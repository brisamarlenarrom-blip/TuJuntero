import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  // Nombre del usuario para mostrar la inicial en el avatar
  get nombre(): string {
    return this.auth.getUsuarioActual()?.nombre || '';
  }

  constructor(public auth: AuthService, private router: Router) {}

  // Cierra la sesión y redirige al inicio
  logout() {
    this.auth.logout();
    this.router.navigate(['/inicio']);
  }
}