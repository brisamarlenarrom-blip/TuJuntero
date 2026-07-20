// Diario de Alimentarse
// Permite registrar comidas del día, calcular registros y sumar calorías.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-diario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
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
    {
      valor: 'desayuno',
      label: 'Desayuno',
      icono: '🥣'
    },
    {
      valor: 'almuerzo',
      label: 'Almuerzo',
      icono: '🍽️'
    },
    {
      valor: 'merienda',
      label: 'Merienda',
      icono: '☕'
    },
    {
      valor: 'cena',
      label: 'Cena',
      icono: '🌙'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private fs: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {
    this.comidaForm = this.fb.group({
      tipo: [
        'desayuno',
        Validators.required
      ],

      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

      calorias: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      notas: ['']
    });
  }

  ngOnInit(): void {
    const usuario = this.auth.getUsuarioActual();

    if (usuario) {
      this.usuarioId = usuario.id;
    }

    this.cargarComidasHoy();
  }

  /**
   * Devuelve la fecha local en formato:
   * año-mes-día.
   *
   * Se utiliza la fecha local para evitar problemas
   * ocasionados por toISOString(), que trabaja en UTC.
   */
  obtenerFechaHoy(): string {
    const fecha = new Date();

    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  /**
   * Carga solamente las comidas registradas
   * durante el día actual por el usuario.
   */
  cargarComidasHoy(): void {
    if (!this.usuarioId) {
      return;
    }

    const hoy = this.obtenerFechaHoy();

    this.fs
      .getByField(
        'comidas',
        'usuarioId',
        this.usuarioId
      )
      .subscribe(data => {

        this.comidasHoy = data
          .filter((comida: any) => {
            return comida.fecha === hoy;
          })
          .sort((a: any, b: any) => {
            const fechaA =
              a.creadaEn?.seconds ||
              a.creadaEn?.getTime?.() ||
              0;

            const fechaB =
              b.creadaEn?.seconds ||
              b.creadaEn?.getTime?.() ||
              0;

            return fechaB - fechaA;
          });

        this.calcularTotalCalorias();
      });
  }

  /**
   * Calcula la cantidad total de calorías
   * registradas durante el día.
   */
  calcularTotalCalorias(): void {
    this.totalCalorias = this.comidasHoy.reduce(
      (total: number, comida: any) => {
        return total + Number(comida.calorias || 0);
      },
      0
    );
  }

  /**
   * Guarda una nueva comida en Firestore.
   */
  async guardarComida(): Promise<void> {
    this.mensaje = '';

    if (
      this.comidaForm.invalid ||
      !this.usuarioId
    ) {
      this.comidaForm.markAllAsTouched();
      return;
    }

    const hoy = this.obtenerFechaHoy();

    const datos = {
      tipo: this.comidaForm.value.tipo,

      nombre:
        this.comidaForm.value.nombre.trim(),

      calorias: Number(
        this.comidaForm.value.calorias || 0
      ),

      notas:
        this.comidaForm.value.notas?.trim() || '',

      usuarioId: this.usuarioId,

      fecha: hoy,

      creadaEn: new Date()
    };

    try {
      await this.fs.create(
        'comidas',
        datos
      );

      this.mensaje =
        'Comida registrada correctamente.';

      this.comidaForm.reset({
        tipo: 'desayuno',
        nombre: '',
        calorias: 0,
        notas: ''
      });

      setTimeout(() => {
        this.mensaje = '';
      }, 3000);

    } catch (error) {
      console.error(
        'Error al registrar la comida:',
        error
      );

      this.mensaje =
        'No se pudo registrar la comida.';
    }
  }

  /**
   * Elimina un registro de comida.
   */
  async eliminarComida(id: string): Promise<void> {
    const confirmar = confirm(
      '¿Eliminar este registro?'
    );

    if (!confirmar) {
      return;
    }

    try {
      await this.fs.delete(
        'comidas',
        id
      );

    } catch (error) {
      console.error(
        'Error al eliminar la comida:',
        error
      );

      this.mensaje =
        'No se pudo eliminar el registro.';
    }
  }

  /**
   * Devuelve el ícono correspondiente
   * al tipo de comida.
   */
  getTipoIcono(tipo: string): string {
    return this.tiposComida.find(
      tipoComida =>
        tipoComida.valor === tipo
    )?.icono || '🍽️';
  }

  /**
   * Devuelve el nombre visible
   * del tipo de comida.
   */
  getTipoLabel(tipo: string): string {
    return this.tiposComida.find(
      tipoComida =>
        tipoComida.valor === tipo
    )?.label || 'Comida';
  }

  /**
   * Vuelve al inicio del módulo Alimentarse.
   */
  volver(): void {
    this.router.navigate([
      '/alimentarse'
    ]);
  }
}