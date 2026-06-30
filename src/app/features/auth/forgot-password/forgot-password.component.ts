import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  form: FormGroup;
  mensaje = '';
  error = '';
  cargando = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async enviar() {
    if (this.form.invalid) return;
    this.cargando = true;
    this.mensaje = '';
    this.error = '';
    
    try {
      await this.authService.resetPassword(this.form.value.email);
      this.mensaje = '📧 Te enviamos un mail para restablecer tu contraseña. Revisá tu bandeja de entrada.';
    } catch (e: any) {
      this.error = 'Error al enviar el mail. ¿Está bien escrito el email?';
    }
    this.cargando = false;
  }
}