// Componente Recuperar Contraseña
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { FirestoreService } from '../../../core/firestore.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  mensaje = '';
  error = '';
  paso = 1; // 1: email, 2: pregunta seguridad, 3: nueva contraseña
  usuarioEncontrado: any = null;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private fs: FirestoreService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      fechaNacimiento: [''],
      nuevaPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Paso 1: buscar usuario por email
  buscarUsuario() {
  this.cargando = true;
  this.error = '';
  const email = this.forgotForm.value.email;
  this.fs.getByField('usuarios', 'email', email).subscribe((data: any[]) => {
    this.cargando = false;
    if (data.length > 0) {
      this.usuarioEncontrado = data[0];
      this.paso = 2;
      this.mensaje = 'Respondé la pregunta de seguridad';
    } else {
      this.error = 'No se encontró un usuario con ese email';
    }
  });
}

  // Paso 2: verificar fecha de nacimiento
  verificarFecha() {
  this.cargando = true;
  const fecha = this.forgotForm.value.fechaNacimiento;
  if (fecha === this.usuarioEncontrado.fechaNacimiento) {
    this.paso = 3;
    this.mensaje = 'Ingresá tu nueva contraseña';
    this.error = '';
  } else {
    this.error = 'La fecha de nacimiento no coincide';
  }
  this.cargando = false;
}

  // Paso 3: cambiar contraseña
  cambiarPassword() {
    const nuevaPassword = this.forgotForm.value.nuevaPassword;
    this.fs.update('usuarios', this.usuarioEncontrado.id, { password: nuevaPassword }).then(() => {
      this.mensaje = 'Contraseña actualizada. Redirigiendo al login...';
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
    });
  }
}