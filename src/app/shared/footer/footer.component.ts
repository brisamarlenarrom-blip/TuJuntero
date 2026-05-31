import { Component } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

  rutaActual = '';

  // Muestra la flecha si estamos en una subruta (más de un segmento)
  get mostrarFlecha(): boolean {
    const segmentos = this.rutaActual.split('/').filter(s => s);
    return segmentos.length > 1;
  }
  
constructor(private router: Router) {
  // Captura la ruta inicial al cargar
  this.rutaActual = this.router.url;
  
  this.router.events
    .pipe(filter(e => e instanceof NavigationEnd))
    .subscribe((e: any) => {
      this.rutaActual = e.urlAfterRedirects;
    });
}

  volver() {
    const segmentos = this.rutaActual.split('/').filter(s => s);
    if (segmentos.length <= 1) {
      this.router.navigate(['/inicio']);
    } else {
      segmentos.pop();
      this.router.navigate(['/' + segmentos.join('/')]);
    }
  }
}