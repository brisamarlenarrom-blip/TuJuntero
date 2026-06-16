import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../core/firestore.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-panel-mentores',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  templateUrl: './panel-mentores.component.html',
  styleUrl: './panel-mentores.component.css'
})
export class PanelMentoresComponent implements OnInit {
  usuarios: any[] = [];
  esAdmin = false;

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.auth.getUsuarioActual();
    // Verifica si es admin (podés ajustar según tu lógica)
    this.esAdmin = user?.rol === 'admin' || user?.email === 'brisamarlenarrom@gmail.com';

    if (!this.esAdmin) {
      this.router.navigate(['/inicio']);
      return;
    }

    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.fs.getCollection('usuarios').subscribe((data: any[]) => {
      this.usuarios = data;
    });
  }

  // Convierte un usuario en mentor
  async convertirEnMentor(usuario: any) {
    await this.fs.update('usuarios', usuario.id, {
      esMentor: true,
      especialidad: usuario.especialidad || 'Entrenador',
      frase: usuario.frase || 'Ayudando a otros a crecer',
      biografia: usuario.biografia || ''
    });
    this.cargarUsuarios();
  }

  // Quita el rol de mentor
  async quitarMentor(usuario: any) {
    await this.fs.update('usuarios', usuario.id, {
      esMentor: false
    });
    this.cargarUsuarios();
  }

  volver() {
    this.router.navigate(['/inicio']);
  }
}