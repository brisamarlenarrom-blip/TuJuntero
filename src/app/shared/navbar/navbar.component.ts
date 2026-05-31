import { Component } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  rutaActual = '';

  get nombre(): string {
    return this.auth.getUsuarioActual()?.nombre || '';
  }

  // Muestra la flecha si no estamos en inicio
  get mostrarFlecha(): boolean {
    return this.rutaActual !== '/inicio' && this.rutaActual !== '/';
  }

  // Título según la ruta actual
  get tituloRuta(): string {
    const segmentos = this.rutaActual.split('/').filter(s => s);
    const titulos: Record<string, string> = {
      'aprender':      'Aprender',
      'materias':      'Materias',
      'tareas':        'Tareas',
      'biblioteca':    'Biblioteca',
      'alimentarse':   'Alimentarse',
      'recetas':       'Mis Recetas',
      'diario':        'Diario',
      'entrenamiento': 'Entrenamiento',
      'comunidad':     'Comunidad',
      'perfil':        'Perfil',
      'auth':          'Cuenta',
      'login':         'Iniciar sesión',
      'register':      'Registrarse'
    };
    const ultimo = segmentos[segmentos.length - 1];
    return titulos[ultimo] || 'TuJuntero';
  }

  constructor(public auth: AuthService, private router: Router) {
    // Escucha cambios de ruta
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.rutaActual = e.urlAfterRedirects;
      });
  }

  // Navega un nivel arriba en la jerarquía
  volver() {
    const segmentos = this.rutaActual.split('/').filter(s => s);
    if (segmentos.length <= 1) {
      this.router.navigate(['/inicio']);
    } else {
      segmentos.pop();
      this.router.navigate(['/' + segmentos.join('/')]);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/inicio']);
  }
}