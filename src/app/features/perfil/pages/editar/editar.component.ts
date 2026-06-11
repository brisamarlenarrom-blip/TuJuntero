import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, Usuario } from '../../../../core/auth.service';

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.css'
})
export class EditarPerfilComponent implements OnInit {

  nombre = '';
  apellido = '';
  fechaNacimiento = '';
  bio = '';
  nivelEstudios = '';
  carreraOInteres = '';
  trabaja = false;
  horasTrabajoPorDia = 0;
  haceDeporte = false;
  queDeporte = '';
  frecuenciaDeporte = '';

  guardando = false;
  mensajeExito = '';
  mensajeError = '';
  iniciales = '';

  nivelesEstudio = [
    'Secundario incompleto',
    'Secundario completo',
    'Terciario/Universitario en curso',
    'Terciario completo',
    'Universitario completo',
    'Posgrado'
  ];

  frecuenciasDeporte = [
    '1-2 veces por semana',
    '3-4 veces por semana',
    '5 o más veces por semana',
    'Todos los días'
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (!usuario) { this.router.navigate(['/perfil']); return; }

    this.nombre             = usuario.nombre || '';
    this.apellido           = usuario.apellido || '';
    this.fechaNacimiento    = usuario.fechaNacimiento || '';
    this.bio                = (usuario as any).bio || '';
    this.nivelEstudios      = usuario.nivelEstudios || '';
    this.carreraOInteres    = usuario.carreraOInteres || '';
    this.trabaja            = usuario.trabaja || false;
    this.horasTrabajoPorDia = usuario.horasTrabajoPorDia || 0;
    this.haceDeporte        = usuario.haceDeporte || false;
    this.queDeporte         = usuario.queDeporte || '';
    this.frecuenciaDeporte  = usuario.frecuenciaDeporte || '';
    this.actualizarIniciales();
  }

  actualizarIniciales() {
    this.iniciales = (this.nombre.charAt(0) + (this.apellido.charAt(0) || '')).toUpperCase();
  }

  async guardar() {
    if (!this.nombre.trim() || !this.apellido.trim()) {
      this.mensajeError = 'Nombre y apellido son obligatorios.';
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    try {
      await this.auth.actualizarUsuario({
        nombre:             this.nombre.trim(),
        apellido:           this.apellido.trim(),
        fechaNacimiento:    this.fechaNacimiento,
        bio:                this.bio,
        nivelEstudios:      this.nivelEstudios,
        carreraOInteres:    this.carreraOInteres,
        trabaja:            this.trabaja,
        horasTrabajoPorDia: this.trabaja ? this.horasTrabajoPorDia : 0,
        haceDeporte:        this.haceDeporte,
        queDeporte:         this.haceDeporte ? this.queDeporte : '',
        frecuenciaDeporte:  this.haceDeporte ? this.frecuenciaDeporte : '',
      } as any);

      this.mensajeExito = '¡Perfil actualizado con éxito! 🎉';
      setTimeout(() => this.router.navigate(['/perfil']), 1500);
    } catch (e) {
      this.mensajeError = 'Hubo un error al guardar. Intentá de nuevo.';
    } finally {
      this.guardando = false;
    }
  }

  volver() {
    this.router.navigate(['/perfil']);
  }
}