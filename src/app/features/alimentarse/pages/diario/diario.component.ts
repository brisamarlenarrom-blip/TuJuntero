// Diario de Alimentarse
// Permite registrar comidas del día, calcular registros y sumar calorías.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-diario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './diario.component.html',
  styleUrl: './diario.component.css'
})
export class DiarioComponent implements OnInit {

  // Usuario logueado
  usuarioId = '';

  // Registros de comidas del día
  comidasHoy: any[] = [];

  // Total de calorías del día
  totalCalorias = 0;

  // Mensaje visual
  mensaje = '';

  // Formulario reactivo
  comidaForm: FormGroup;

  // Tipos de comida disponibles
  tiposComida = [
    { valor: 'desayuno', label: 'Desayuno', icono: '🥣' },
    { valor: 'almuerzo', label: 'Almuerzo', icono: '🍽️' },
    { valor: 'merienda', label: 'Merienda', icono: '☕' },
    { valor: 'cena', label: 'Cena', icono: '🌙' }
  ];

  constructor(
    private fb: FormBuilder,
    private fs: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {
    this.comidaForm = this.fb.group({
      tipo: ['desayuno', Validators.required],
      nombre: ['', Validators.required],
      calorias: [0],
      notas: ['']
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();

    if (usuario) {
      this.usuarioId = usuario.id;
    }

    this.cargarComidasHoy();
  }

  // Carga solamente las comidas registradas hoy por el usuario
  cargarComidasHoy() {
    if (!this.usuarioId) return;

    const hoy = new Date().toISOString().split('T')[0];

    this.fs.getByField('comidas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.comidasHoy = data.filter((c: any) => c.fecha === hoy);

      this.totalCalorias = this.comidasHoy.reduce(
        (total: number, comida: any) => total + Number(comida.calorias || 0),
        0
      );
    });
  }

  // Guarda una comida nueva en Firestore
  async guardarComida() {
    if (this.comidaForm.invalid || !this.usuarioId) return;

    const hoy = new Date().toISOString().split('T')[0];

    const datos = {
      ...this.comidaForm.value,
      calorias: Number(this.comidaForm.value.calorias || 0),
      usuarioId: this.usuarioId,
      fecha: hoy,
      creadaEn: new Date()
    };

    await this.fs.create('comidas', datos);

    this.mensaje = 'Comida registrada correctamente.';

    this.comidaForm.reset({
      tipo: 'desayuno',
      nombre: '',
      calorias: 0,
      notas: ''
    });
  }

  // Elimina un registro de comida
  async eliminarComida(id: string) {
    if (confirm('¿Eliminar este registro?')) {
      await this.fs.delete('comidas', id);
    }
  }

  // Devuelve el ícono según tipo de comida
  getTipoIcono(tipo: string): string {
    return this.tiposComida.find(t => t.valor === tipo)?.icono || '🍽️';
  }

  // Devuelve el nombre visible según tipo de comida
  getTipoLabel(tipo: string): string {
    return this.tiposComida.find(t => t.valor === tipo)?.label || 'Comida';
  }

  // Vuelve al módulo Alimentarse
  volver() {
    this.router.navigate(['/alimentarse']);
  }
}