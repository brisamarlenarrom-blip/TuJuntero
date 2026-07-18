import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,

  /*
   * CommonModule permite utilizar directivas como *ngIf.
   *
   * ReactiveFormsModule permite crear y controlar
   * formularios reactivos.
   *
   * RouterModule permite utilizar routerLink en el HTML.
   *
   * Los módulos de Angular Material proporcionan
   * la tarjeta, los campos y los botones.
   */
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],

  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

  /* =====================================================
     FORMULARIO
     ===================================================== */

  form: FormGroup;

  /* =====================================================
     ESTADO DE LA INTERFAZ
     ===================================================== */

  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    /*
     * El formulario contiene un solo campo: email.
     *
     * Validators.required comprueba que no esté vacío.
     * Validators.email comprueba el formato del correo.
     */
    this.form = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ]
    });
  }

  /* =====================================================
     ENVÍO DEL EMAIL DE RECUPERACIÓN
     ===================================================== */

  async enviar(): Promise<void> {
    /*
     * Limpiamos los mensajes anteriores.
     */
    this.mensaje = '';
    this.error = '';

    /*
     * Si el formulario es inválido, marcamos el campo
     * como tocado para mostrar las validaciones.
     */
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    /*
     * Evita que el usuario envíe varias solicitudes
     * mientras Firebase todavía está procesando una.
     */
    if (this.cargando) {
      return;
    }

    this.cargando = true;

    /*
     * Obtenemos el email y eliminamos espacios
     * accidentales al comienzo o al final.
     */
    const email = String(
      this.form.getRawValue().email
    )
      .trim()
      .toLowerCase();

    try {
      /*
       * AuthService solicita a Firebase Authentication
       * el envío del correo de recuperación.
       */
      await this.authService.resetPassword(email);

      this.mensaje =
        '📧 Te enviamos un email para restablecer tu contraseña. Revisá tu bandeja de entrada y la carpeta de spam.';

    } catch (error: unknown) {
      console.error(
        'Error al enviar el correo de recuperación:',
        error
      );

      this.error = this.obtenerMensajeDeError(error);

    } finally {
      /*
       * finally se ejecuta siempre, haya éxito o error.
       */
      this.cargando = false;
    }
  }

  /* =====================================================
     MENSAJES DE ERROR
     ===================================================== */

  private obtenerMensajeDeError(error: unknown): string {
    /*
     * Comprobamos que el error sea un objeto
     * y tenga una propiedad code.
     */
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error
    ) {
      const codigoError = String(error.code);

      switch (codigoError) {
        case 'auth/invalid-email':
          return 'El email ingresado no es válido.';

        case 'auth/user-not-found':
          return 'No encontramos una cuenta asociada a ese email.';

        case 'auth/network-request-failed':
          return 'No se pudo conectar con el servidor. Revisá tu conexión a internet.';

        case 'auth/too-many-requests':
          return 'Se realizaron demasiados intentos. Esperá unos minutos y volvé a intentar.';

        default:
          return 'No se pudo enviar el email de recuperación. Intentá nuevamente.';
      }
    }

    return 'No se pudo enviar el email de recuperación. Intentá nuevamente.';
  }
}