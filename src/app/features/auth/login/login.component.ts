// Importaciones para el formulario de Login
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';  // Formularios reactivos
import { MatFormFieldModule } from '@angular/material/form-field';  // Campos de formulario Material
import { MatInputModule } from '@angular/material/input';            // Inputs Material
import { MatButtonModule } from '@angular/material/button';          // Botones Material
import { MatCardModule } from '@angular/material/card';              // Tarjetas Material
import { Router, RouterModule } from '@angular/router';              // Navegación
import { AuthService } from '../../../core/auth.service';            // Servicio de autenticación

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,    // Necesario para formGroup, formControlName
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  
  loginForm: FormGroup;   // El formulario reactivo
  error = '';             // Mensaje de error si las credenciales son incorrectas

  constructor(
    private fb: FormBuilder,        // Para crear el formulario fácilmente
    private auth: AuthService,      // Servicio de autenticación
    private router: Router          // Para redirigir después del login
  ) {
    // Crea el formulario con dos campos: email y password
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],        // Campo obligatorio y formato email
      password: ['', [Validators.required, Validators.minLength(6)]] // Obligatorio, mínimo 6 caracteres
    });
  }

  // Se ejecuta al enviar el formulario
  onSubmit() {
    if (this.loginForm.valid) {                          // Solo si el formulario es válido
      const { email, password } = this.loginForm.value;  // Obtiene email y password
      this.auth.login(email, password).subscribe(success => {
        if (success) {
          this.router.navigate(['/inicio']);  // Si es correcto, va al inicio
        } else {
          this.error = 'Email o contraseña incorrectos';  // Muestra error
        }
      });
    }
  }
}