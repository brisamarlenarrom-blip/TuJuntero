import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,

  /*
   * CommonModule permite utilizar directivas como *ngIf.
   *
   * ReactiveFormsModule permite trabajar con formularios reactivos.
   *
   * RouterModule permite utilizar routerLink en el HTML.
   */
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],

  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  /* =====================================================
     FORMULARIO DE REGISTRO
     ===================================================== */

  registerForm: FormGroup;

  /* =====================================================
     ESTADO DE LA INTERFAZ
     ===================================================== */

  errorMensaje = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    /*
     * FormBuilder permite crear el formulario y declarar
     * las validaciones de cada campo desde TypeScript.
     */
    this.registerForm = this.fb.group({
      nombre: [
        '',
        [
          Validators.required
        ]
      ],

      apellido: [
        '',
        [
          Validators.required
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],

      fechaNacimiento: [
        '',
        [
          Validators.required
        ]
      ]
    });
  }

  /* =====================================================
     ENVÍO DEL FORMULARIO
     ===================================================== */

  async onSubmit(): Promise<void> {
    /*
     * Limpiamos cualquier error anterior.
     */
    this.errorMensaje = '';

    /*
     * Si el formulario es inválido, marcamos todos los
     * controles como tocados para mostrar los errores.
     */
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    /*
     * Evita enviar el formulario más de una vez mientras
     * se está procesando el registro.
     */
    if (this.cargando) {
      return;
    }

    this.cargando = true;

    /*
     * Obtenemos los datos ingresados por el usuario.
     */
    const {
      nombre,
      apellido,
      email,
      password,
      fechaNacimiento
    } = this.registerForm.getRawValue();

    /*
     * Creamos un objeto limpio antes de enviarlo al servicio.
     */
    const datosRegistro = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim().toLowerCase(),
      password,
      fechaNacimiento
    };

    try {
      /*
       * AuthService se encarga de crear la cuenta
       * en Firebase Authentication y guardar los datos
       * del usuario en Firestore.
       */
      await this.auth.register(datosRegistro);

      /*
       * Cuando el registro termina correctamente,
       * redirigimos al usuario a Inicio.
       */
      await this.router.navigate(['/inicio']);

    } catch (error: unknown) {
      console.error('Error al registrar al usuario:', error);

      this.errorMensaje =
        this.obtenerMensajeDeError(error);

    } finally {
      /*
       * finally se ejecuta siempre, tanto si el registro
       * fue exitoso como si ocurrió un error.
       */
      this.cargando = false;
    }
  }

  /* =====================================================
     MANEJO DE ERRORES
     ===================================================== */

  private obtenerMensajeDeError(error: unknown): string {
    /*
     * Verificamos que el error sea un objeto y que tenga
     * una propiedad llamada code.
     */
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error
    ) {
      const codigoError = String(error.code);

      switch (codigoError) {
        case 'auth/email-already-in-use':
          return 'Este email ya está registrado. Iniciá sesión o usá otro correo.';

        case 'auth/invalid-email':
          return 'El email ingresado no es válido.';

        case 'auth/weak-password':
          return 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';

        case 'auth/network-request-failed':
          return 'No se pudo conectar con el servidor. Revisá tu conexión a internet.';

        default:
          return 'No se pudo crear la cuenta. Intentá nuevamente.';
      }
    }

    return 'No se pudo crear la cuenta. Intentá nuevamente.';
  }
}