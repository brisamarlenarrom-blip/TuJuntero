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

  // Lista de usuarios obtenidos desde Firestore
  usuarios: any[] = [];

  // Indica si el usuario logueado es administrador
  esAdmin = false;

  // Guarda el ID del usuario que se está actualizando
  // (para evitar hacer doble clic en los botones)
  guardandoId = '';

  // Mensaje informativo para mostrar en pantalla
  mensaje = '';

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {

    // Obtiene el usuario que inició sesión
    const user = this.auth.getUsuarioActual();

    // Verifica si tiene permisos de administrador
    // También permite ingresar con tu email por seguridad
    this.esAdmin =
      user?.rol === 'admin' ||
      user?.email === 'brisamarlenarrom@gmail.com';

    // Si no es administrador vuelve al inicio
    if (!this.esAdmin) {
      this.router.navigate(['/inicio']);
      return;
    }

    // Carga todos los usuarios de la base de datos
    this.cargarUsuarios();
  }

  // ============================
  // Cargar usuarios
  // ============================
  cargarUsuarios() {

    this.fs.getCollection('usuarios').subscribe((data: any[]) => {

      // Guarda los usuarios obtenidos desde Firestore
      this.usuarios = data;

    });

  }

  // ============================
  // Convertir usuario en mentor
  // ============================
  async convertirEnMentor(usuario: any) {

    try {

      // Deshabilita el botón mientras se guarda
      this.guardandoId = usuario.id;

      // Limpia el mensaje anterior
      this.mensaje = '';

      // Actualiza el documento del usuario en Firestore
      await this.fs.update('usuarios', usuario.id, {

        // Cambia el rol del usuario
        rol: 'mentor',

        // Marca que es mentor
        esMentor: true,

        // Datos opcionales del mentor
        especialidad:
          usuario.especialidad || 'Nutrición y hábitos saludables',

        frase:
          usuario.frase || 'Ayudando a otros a crecer',

        biografia:
          usuario.biografia || ''

      });

      // Mensaje de éxito
      this.mensaje = 'Usuario convertido en mentor correctamente.';

    } catch (error) {

      console.error('Error al convertir mentor', error);

      this.mensaje = 'No se pudo actualizar el usuario.';

    } finally {

      // Vuelve a habilitar el botón
      this.guardandoId = '';

    }

  }

  // ============================
  // Quitar rol de mentor
  // ============================
  async quitarMentor(usuario: any) {

    try {

      // Deshabilita el botón
      this.guardandoId = usuario.id;

      // Limpia mensajes anteriores
      this.mensaje = '';

      // Actualiza el documento del usuario
      await this.fs.update('usuarios', usuario.id, {

        // Vuelve al rol usuario
        rol: 'usuario',

        // Ya no será mentor
        esMentor: false

      });

      // Mensaje de éxito
      this.mensaje = 'Mentor quitado correctamente.';

    } catch (error) {

      console.error('Error al quitar mentor', error);

      this.mensaje = 'No se pudo actualizar el usuario.';

    } finally {

      // Habilita nuevamente el botón
      this.guardandoId = '';

    }

  }

  // ============================
  // Volver al inicio
  // ============================
  volver() {

    this.router.navigate(['/inicio']);

  }

}