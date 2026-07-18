import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,

  /*
   * ReactiveFormsModule permite trabajar con formularios reactivos.
   *
   * Los módulos de Angular Material proporcionan los componentes
   * visuales utilizados en el formulario.
   *
   * RouterModule permite utilizar routerLink en el HTML.
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

  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  /* =====================================================
     FORMULARIO
     ===================================================== */

  loginForm: FormGroup;

  /* =====================================================
     ESTADO DE LA INTERFAZ
     ===================================================== */

  error = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    /*
     * FormBuilder permite crear el formulario y sus controles
     * de una manera más organizada.
     */
    this.loginForm = this.fb.group({
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
      ]
    });
  }

  /* =====================================================
     INICIO DE SESIÓN CON EMAIL Y CONTRASEÑA
     ===================================================== */

  async onSubmit(): Promise<void> {
    /*
     * Limpiamos cualquier mensaje de error anterior.
     */
    this.error = '';

    /*
     * Si el formulario es inválido, marcamos todos los campos
     * como tocados para que se muestren las validaciones.
     */
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    /*
     * Evita enviar el formulario más de una vez mientras
     * se está procesando el inicio de sesión.
     */
    if (this.cargando) {
      return;
    }

    this.cargando = true;

    /*
     * getRawValue obtiene los valores actuales del formulario.
     */
    const { email, password } = this.loginForm.getRawValue();

    try {
      const ingresoCorrecto = await this.auth.login(
        email.trim(),
        password
      );

      if (!ingresoCorrecto) {
        this.error = 'El email o la contraseña son incorrectos.';
        return;
      }

      /*
       * Cuando la autenticación es correcta, Angular Router
       * redirige al usuario a la pantalla de Inicio.
       */
      await this.router.navigate(['/inicio']);

    } catch (error) {
      console.error(
        'Ocurrió un error al iniciar sesión:',
        error
      );

      this.error =
        'No se pudo iniciar sesión. Intentá nuevamente.';

    } finally {
      /*
       * finally se ejecuta tanto si la operación sale bien
       * como si ocurre un error.
       */
      this.cargando = false;
    }
  }

  /* =====================================================
     INICIO DE SESIÓN CON GOOGLE
     ===================================================== */

  async loginWithGoogle(): Promise<void> {
    this.error = '';

    if (this.cargando) {
      return;
    }

    this.cargando = true;

    try {
      const ingresoCorrecto =
        await this.auth.loginWithGoogle();

      if (!ingresoCorrecto) {
        this.error =
          'No se pudo iniciar sesión con Google.';

        return;
      }

      await this.router.navigate(['/inicio']);

    } catch (error) {
      console.error(
        'Ocurrió un error al ingresar con Google:',
        error
      );

      this.error =
        'No se pudo iniciar sesión con Google. Intentá nuevamente.';

    } finally {
      this.cargando = false;
    }
  }
}