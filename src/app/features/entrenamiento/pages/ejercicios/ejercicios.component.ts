// Componente de Gestión de Ejercicios
// Permite que mentores y administradores creen, editen
// y eliminen ejercicios utilizados en Entrenamiento.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-ejercicios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './ejercicios.component.html',
  styleUrl: './ejercicios.component.css'
})
export class EjerciciosComponent implements OnInit {

  // ─────────────────────────────────────────────
  // USUARIO Y PERMISOS
  // ─────────────────────────────────────────────

  usuarioId = '';
  nombreMentor = '';

  esMentor = false;
  esAdmin = false;
  puedeGestionar = false;

  // ─────────────────────────────────────────────
  // LISTADO Y FILTROS
  // ─────────────────────────────────────────────

  ejercicios: any[] = [];
  ejerciciosFiltrados: any[] = [];

  busqueda = '';
  categoriaActiva = 'todos';

  categorias = [
    { valor: 'todos', label: 'Todos', icono: '📋' },
    { valor: 'fuerza', label: 'Fuerza', icono: '🏋️' },
    { valor: 'cardio', label: 'Cardio', icono: '❤️' },
    { valor: 'movilidad', label: 'Movilidad', icono: '🧘' },
    { valor: 'hiit', label: 'HIIT', icono: '⚡' }
  ];

  // ─────────────────────────────────────────────
  // ESTADO DEL FORMULARIO
  // ─────────────────────────────────────────────

  mostrarForm = false;
  editando = false;
  ejercicioEditId: string | null = null;

  guardando = false;
  mensaje = '';

  ejercicioForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private fs: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {
    // Formulario reactivo para crear o editar ejercicios.
    this.ejercicioForm = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['fuerza', Validators.required],
      grupoMuscular: ['', Validators.required],
      nivel: ['principiante', Validators.required],
      equipamiento: ['sin_equipamiento', Validators.required],
      series: [3, [Validators.required, Validators.min(1)]],
      repeticiones: ['10-12', Validators.required],
      descanso: ['60 segundos', Validators.required],
      descripcion: ['']
    });
  }

  // ─────────────────────────────────────────────
  // INICIALIZACIÓN
  // ─────────────────────────────────────────────

  async ngOnInit() {
    // Espera a que Firebase recupere la sesión.
    await this.auth.authReadyPromise;

    // Obtiene el usuario actualizado desde Firestore.
    const usuario = await this.auth.refrescarUsuarioActual();

    if (usuario) {
      this.usuarioId = usuario.id;
      this.nombreMentor = usuario.nombre || '';

      this.esMentor =
        usuario.esMentor === true ||
        usuario.rol === 'mentor';

      this.esAdmin = usuario.rol === 'admin';

      this.puedeGestionar =
        this.esMentor ||
        this.esAdmin;
    }

    // Si no tiene permiso, vuelve al inicio de Entrenamiento.
    if (!this.puedeGestionar) {
      this.router.navigate(['/entrenamiento']);
      return;
    }

    this.cargarEjercicios();
  }

  // ─────────────────────────────────────────────
  // CARGA DE EJERCICIOS
  // ─────────────────────────────────────────────

  cargarEjercicios() {
    this.fs
      .getCollection('ejercicios')
      .subscribe((data: any[]) => {

        /*
         * El administrador ve todos los ejercicios.
         * El mentor ve sus propios ejercicios.
         */
        this.ejercicios = this.esAdmin
          ? data
          : data.filter(
              (ejercicio: any) =>
                ejercicio.mentorId === this.usuarioId ||
                ejercicio.creadoPor === this.usuarioId
            );

        this.aplicarFiltro();
      });
  }

  // ─────────────────────────────────────────────
  // BUSCADOR Y FILTROS
  // ─────────────────────────────────────────────

  setCategoria(categoria: string) {
    this.categoriaActiva = categoria;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    const texto = this.busqueda
      .toLowerCase()
      .trim();

    this.ejerciciosFiltrados = this.ejercicios.filter(
      (ejercicio: any) => {

        const coincideCategoria =
          this.categoriaActiva === 'todos' ||
          ejercicio.categoria === this.categoriaActiva;

        const coincideBusqueda =
          !texto ||
          String(ejercicio.nombre || '')
            .toLowerCase()
            .includes(texto) ||
          String(ejercicio.grupoMuscular || '')
            .toLowerCase()
            .includes(texto) ||
          String(ejercicio.descripcion || '')
            .toLowerCase()
            .includes(texto) ||
          String(ejercicio.equipamiento || '')
            .toLowerCase()
            .includes(texto);

        return coincideCategoria && coincideBusqueda;
      }
    );
  }

  // ─────────────────────────────────────────────
  // ABRIR FORMULARIO
  // ─────────────────────────────────────────────

  abrirNuevo() {
    if (!this.puedeGestionar) return;

    this.editando = false;
    this.ejercicioEditId = null;
    this.mensaje = '';

    this.ejercicioForm.reset({
      nombre: '',
      categoria: 'fuerza',
      grupoMuscular: '',
      nivel: 'principiante',
      equipamiento: 'sin_equipamiento',
      series: 3,
      repeticiones: '10-12',
      descanso: '60 segundos',
      descripcion: ''
    });

    this.mostrarForm = true;
  }

  // ─────────────────────────────────────────────
  // EDITAR EJERCICIO
  // ─────────────────────────────────────────────

  editarEjercicio(ejercicio: any) {
    if (!this.puedeEditarEjercicio(ejercicio)) return;

    this.editando = true;
    this.ejercicioEditId = ejercicio.id;
    this.mensaje = '';

    this.ejercicioForm.patchValue({
      nombre: ejercicio.nombre || '',
      categoria: ejercicio.categoria || 'fuerza',
      grupoMuscular: ejercicio.grupoMuscular || '',
      nivel: ejercicio.nivel || 'principiante',
      equipamiento:
        ejercicio.equipamiento || 'sin_equipamiento',
      series: ejercicio.series || 3,
      repeticiones: ejercicio.repeticiones || '10-12',
      descanso: ejercicio.descanso || '60 segundos',
      descripcion: ejercicio.descripcion || ''
    });

    this.mostrarForm = true;
  }

  // ─────────────────────────────────────────────
  // GUARDAR EJERCICIO
  // ─────────────────────────────────────────────

  async guardarEjercicio() {
    if (
      this.ejercicioForm.invalid ||
      !this.puedeGestionar ||
      !this.usuarioId
    ) {
      this.ejercicioForm.markAllAsTouched();
      return;
    }

    try {
      this.guardando = true;
      this.mensaje = '';

      const datos = {
        ...this.ejercicioForm.getRawValue(),

        // Convierte series a número.
        series: Number(
          this.ejercicioForm.value.series || 1
        ),

        mentorId: this.usuarioId,
        creadoPor: this.usuarioId,
        nombreMentor: this.nombreMentor,

        // Los usuarios pueden ver el ejercicio.
        esPublico: true,

        fechaActualizacion: new Date().toISOString()
      };

      if (this.editando && this.ejercicioEditId) {
        await this.fs.update(
          'ejercicios',
          this.ejercicioEditId,
          datos
        );

        this.mensaje =
          'Ejercicio actualizado correctamente.';
      } else {
        await this.fs.create(
          'ejercicios',
          {
            ...datos,
            fechaCreacion: new Date().toISOString()
          }
        );

        this.mensaje =
          'Ejercicio creado correctamente.';
      }

      this.cerrarForm();

    } catch (error) {
      console.error(
        'Error al guardar el ejercicio:',
        error
      );

      this.mensaje =
        'No se pudo guardar el ejercicio.';
    } finally {
      this.guardando = false;
    }
  }

  // ─────────────────────────────────────────────
  // ELIMINAR EJERCICIO
  // ─────────────────────────────────────────────

  async eliminarEjercicio(ejercicio: any) {
    if (!this.puedeEditarEjercicio(ejercicio)) return;

    const confirmar = confirm(
      `¿Eliminar el ejercicio "${ejercicio.nombre}"?`
    );

    if (!confirmar) return;

    try {
      await this.fs.delete(
        'ejercicios',
        ejercicio.id
      );

      this.mensaje =
        'Ejercicio eliminado correctamente.';

    } catch (error) {
      console.error(
        'Error al eliminar el ejercicio:',
        error
      );

      this.mensaje =
        'No se pudo eliminar el ejercicio.';
    }
  }

  // El administrador puede editar todos.
  // El mentor solo puede editar los ejercicios que creó.
  puedeEditarEjercicio(ejercicio: any): boolean {
    return (
      this.esAdmin ||
      ejercicio.mentorId === this.usuarioId ||
      ejercicio.creadoPor === this.usuarioId
    );
  }

  // ─────────────────────────────────────────────
  // CERRAR FORMULARIO
  // ─────────────────────────────────────────────

  cerrarForm() {
    this.mostrarForm = false;
    this.editando = false;
    this.ejercicioEditId = null;
    this.guardando = false;

    this.ejercicioForm.reset({
      nombre: '',
      categoria: 'fuerza',
      grupoMuscular: '',
      nivel: 'principiante',
      equipamiento: 'sin_equipamiento',
      series: 3,
      repeticiones: '10-12',
      descanso: '60 segundos',
      descripcion: ''
    });
  }

  // ─────────────────────────────────────────────
  // HELPERS VISUALES
  // ─────────────────────────────────────────────

  getIconoCategoria(categoria: string): string {
    switch (categoria) {
      case 'fuerza':
        return '🏋️';

      case 'cardio':
        return '❤️';

      case 'movilidad':
        return '🧘';

      case 'hiit':
        return '⚡';

      default:
        return '💪';
    }
  }

  getLabelCategoria(categoria: string): string {
    switch (categoria) {
      case 'fuerza':
        return 'Fuerza';

      case 'cardio':
        return 'Cardio';

      case 'movilidad':
        return 'Movilidad';

      case 'hiit':
        return 'HIIT';

      default:
        return categoria || 'Entrenamiento';
    }
  }

  getLabelNivel(nivel: string): string {
    switch (nivel) {
      case 'principiante':
        return 'Principiante';

      case 'intermedio':
        return 'Intermedio';

      case 'avanzado':
        return 'Avanzado';

      default:
        return nivel || 'Principiante';
    }
  }

  getLabelEquipamiento(equipamiento: string): string {
    switch (equipamiento) {
      case 'sin_equipamiento':
        return 'Sin equipamiento';

      case 'mancuernas':
        return 'Mancuernas';

      case 'bandas':
        return 'Bandas elásticas';

      case 'gym_completo':
        return 'Gimnasio completo';

      default:
        return equipamiento || 'Sin equipamiento';
    }
  }

  // ─────────────────────────────────────────────
  // NAVEGACIÓN
  // ─────────────────────────────────────────────

  volver() {
    this.router.navigate(['/entrenamiento']);
  }
}