// Importaciones para el formulario de Registro
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';  // Formularios reactivos
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth.service';  // Servicio de autenticación

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  
  registerForm: FormGroup;  // Formulario reactivo de registro

  constructor(
    private fb: FormBuilder,        // Para crear el formulario
    private auth: AuthService,      // Servicio de autenticación
    private router: Router          // Para redirigir después del registro
  ) {
    // Crea el formulario con los campos del registro
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],                              // Nombre obligatorio
      apellido: ['', Validators.required],                            // Apellido obligatorio
      email: ['', [Validators.required, Validators.email]],           // Email obligatorio y válido
      password: ['', [Validators.required, Validators.minLength(6)]], // Contraseña, mínimo 6 caracteres
      fechaNacimiento: ['', Validators.required]                      // Fecha de nacimiento obligatoria
    });
  }

  // Se ejecuta al enviar el formulario
  onSubmit() {
    if (this.registerForm.valid) {  // Solo si todos los campos son válidos
      this.auth.register(this.registerForm.value).subscribe({
        next: () => {
          this.router.navigate(['/login']);  // Si se registra bien, va al login
        },
        error: () => {
          console.log('Error al registrar');  // Si hay error, lo muestra en consola
        }
      });
    }
  }
}