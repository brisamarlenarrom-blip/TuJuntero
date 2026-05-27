// Importaciones necesarias para el componente raíz
import { Component } from '@angular/core';           // Decorador Component
import { RouterOutlet } from '@angular/router';       // Para mostrar las rutas
import { NavbarComponent } from './shared/navbar/navbar.component';   // Barra superior
import { FooterComponent } from './shared/footer/footer.component';   // Barra inferior

@Component({
  selector: 'app-root',               // Nombre del componente (se usa en index.html)
  standalone: true,                   // Componente independiente (Angular 17+)
  imports: [RouterOutlet, NavbarComponent, FooterComponent],  // Componentes que usa
  templateUrl: './app.component.html', // Archivo HTML de la vista
  styleUrl: './app.component.css'      // Archivo CSS de estilos
})
export class AppComponent {
  title = 'tu-juntero';  // Título de la aplicación
}