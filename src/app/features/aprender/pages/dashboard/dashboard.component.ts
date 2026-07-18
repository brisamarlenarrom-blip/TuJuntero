import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

/* =====================================================
   TIPOS AUXILIARES
   ===================================================== */

/*
 * Firestore puede devolver una fecha de distintas maneras:
 *
 * - Como texto.
 * - Como objeto Date.
 * - Como Timestamp de Firestore, que contiene toDate().
 */
type FechaCompatible =
  | string
  | Date
  | { toDate: () => Date }
  | null
  | undefined;

/*
 * Estados permitidos para una materia.
 *
 * Al usar un tipo específico, TypeScript evita que
 * asignemos por error un estado inexistente.
 */
type EstadoMateria =
  | 'cursando'
  | 'regular'
  | 'a_rendir'
  | 'aprobada'
  | 'abandonada';

/*
 * Estados permitidos para una tarea.
 */
type EstadoTarea =
  | 'pendiente'
  | 'proceso'
  | 'completada';

/* =====================================================
   MODELOS UTILIZADOS POR EL DASHBOARD
   ===================================================== */

interface Materia {
  id?: string;
  usuarioId: string;

  nombre: string;
  estado: EstadoMateria;

  fechaCreacion?: FechaCompatible;
  creadaEn?: FechaCompatible;
  createdAt?: FechaCompatible;
  fecha?: FechaCompatible;
  fechaActualizacion?: FechaCompatible;

  fechaExamen?: string;
  fechaLlamado?: string;
  diaHorario?: string;
}

interface Tarea {
  id?: string;
  usuarioId: string;

  titulo?: string;
  estado: EstadoTarea;

  fechaLimite?: string;

  fechaCreacion?: FechaCompatible;
  creadaEn?: FechaCompatible;
  createdAt?: FechaCompatible;
  fecha?: FechaCompatible;
  fechaActualizacion?: FechaCompatible;
}

interface Libro {
  id?: string;
  usuarioId: string;

  titulo?: string;

  /*
   * Se mantienen ambos campos porque algunos documentos
   * antiguos podrían usar "estado" y otros "estadoLectura".
   */
  estadoLectura?: string;
  estado?: string;

  fechaCreacion?: FechaCompatible;
  creadaEn?: FechaCompatible;
  createdAt?: FechaCompatible;
  fecha?: FechaCompatible;
  fechaActualizacion?: FechaCompatible;
}

/*
 * Tipo común utilizado únicamente para calcular
 * los días de enfoque.
 */
interface ElementoConFechas {
  fechaCreacion?: FechaCompatible;
  creadaEn?: FechaCompatible;
  createdAt?: FechaCompatible;
  fecha?: FechaCompatible;
  fechaActualizacion?: FechaCompatible;
  fechaLimite?: FechaCompatible;
  fechaExamen?: FechaCompatible;
  fechaLlamado?: FechaCompatible;
}

/* =====================================================
   COMPONENTE
   ===================================================== */

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule
  ],

  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  /* =====================================================
     USUARIO ACTUAL
     ===================================================== */

  usuarioId = '';

  /* =====================================================
     RESUMEN DE MATERIAS
     ===================================================== */

  totalMaterias = 0;
  materiasARendir = 0;

  materiasActivas: Materia[] = [];

  /* =====================================================
     RESUMEN DE TAREAS
     ===================================================== */

  totalTareas = 0;
  tareasPendientes = 0;

  proximaTarea: Tarea | null = null;

  /* =====================================================
     RESUMEN DE BIBLIOTECA Y ENFOQUE
     ===================================================== */

  librosEnProgreso = 0;
  diasEnfoque = 0;

  /*
   * Guardamos internamente los datos cargados.
   *
   * Cuando cualquiera de las colecciones cambia,
   * se vuelve a calcular la cantidad de días de enfoque.
   *
   * Esto evita conservar fechas pertenecientes a elementos
   * que hayan sido eliminados posteriormente.
   */
  private materiasCargadas: Materia[] = [];
  private tareasCargadas: Tarea[] = [];
  private librosCargados: Libro[] = [];

  constructor(
    private readonly fs: FirestoreService,
    private readonly auth: AuthService,
    private readonly destroyRef: DestroyRef
  ) {}

  /* =====================================================
     CICLO DE VIDA
     ===================================================== */

  ngOnInit(): void {
    const usuario = this.auth.getUsuarioActual();

    /*
     * Si no existe un usuario autenticado, detenemos la carga.
     *
     * Normalmente el AuthGuard evita esta situación, pero
     * igualmente hacemos esta validación por seguridad.
     */
    if (!usuario) {
      return;
    }

    this.usuarioId = usuario.id;
    this.cargarResumen();
  }

  /* =====================================================
     CARGA GENERAL DEL DASHBOARD
     ===================================================== */

  private cargarResumen(): void {
    this.cargarMaterias();
    this.cargarTareas();
    this.cargarLibros();
  }

  /* =====================================================
     MATERIAS
     ===================================================== */

  private cargarMaterias(): void {
    this.fs
      .getByField<Materia>(
        'materias',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        /*
         * Cancela automáticamente la suscripción cuando
         * Angular destruye el componente.
         *
         * Esto evita fugas de memoria.
         */
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (materias: Materia[]) => {
          this.materiasCargadas = materias;

          this.totalMaterias = materias.length;

          this.materiasARendir = materias.filter(
            materia => materia.estado === 'a_rendir'
          ).length;

          this.materiasActivas = materias.filter(
            materia =>
              materia.estado === 'cursando' ||
              materia.estado === 'regular' ||
              materia.estado === 'a_rendir'
          );

          this.actualizarDiasEnfoque();
        },

        error: error => {
          console.error(
            'No se pudieron cargar las materias:',
            error
          );

          this.materiasCargadas = [];
          this.totalMaterias = 0;
          this.materiasARendir = 0;
          this.materiasActivas = [];

          this.actualizarDiasEnfoque();
        }
      });
  }

  /* =====================================================
     TAREAS
     ===================================================== */

  private cargarTareas(): void {
    this.fs
      .getByField<Tarea>(
        'tareas',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (tareas: Tarea[]) => {
          this.tareasCargadas = tareas;

          this.totalTareas = tareas.length;

          this.tareasPendientes = tareas.filter(
            tarea => tarea.estado === 'pendiente'
          ).length;

          /*
           * Buscamos tareas que:
           *
           * 1. Todavía no estén completadas.
           * 2. Tengan una fecha límite.
           *
           * Después las ordenamos desde la fecha más próxima.
           */
          const tareasConFecha = tareas
            .filter(
              tarea =>
                tarea.estado !== 'completada' &&
                Boolean(tarea.fechaLimite)
            )
            .sort(
              (primeraTarea, segundaTarea) =>
                this.obtenerTiempoFecha(
                  primeraTarea.fechaLimite
                ) -
                this.obtenerTiempoFecha(
                  segundaTarea.fechaLimite
                )
            );

          this.proximaTarea =
            tareasConFecha.length > 0
              ? tareasConFecha[0]
              : null;

          this.actualizarDiasEnfoque();
        },

        error: error => {
          console.error(
            'No se pudieron cargar las tareas:',
            error
          );

          this.tareasCargadas = [];
          this.totalTareas = 0;
          this.tareasPendientes = 0;
          this.proximaTarea = null;

          this.actualizarDiasEnfoque();
        }
      });
  }

  /* =====================================================
     BIBLIOTECA
     ===================================================== */

  private cargarLibros(): void {
    this.fs
      .getByField<Libro>(
        'libros',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (libros: Libro[]) => {
          this.librosCargados = libros;

          this.librosEnProgreso = libros.filter(
            libro =>
              libro.estadoLectura === 'leyendo' ||
              libro.estado === 'leyendo'
          ).length;

          this.actualizarDiasEnfoque();
        },

        error: error => {
          console.error(
            'No se pudieron cargar los libros:',
            error
          );

          this.librosCargados = [];
          this.librosEnProgreso = 0;

          this.actualizarDiasEnfoque();
        }
      });
  }

  /* =====================================================
     DÍAS DE ENFOQUE
     ===================================================== */

  private actualizarDiasEnfoque(): void {
    /*
     * Un Set no permite valores duplicados.
     *
     * De esta manera, si una materia y una tarea fueron
     * creadas el mismo día, ese día se cuenta una sola vez.
     */
    const fechasEnfoque = new Set<string>();

    const elementos: ElementoConFechas[] = [
      ...this.materiasCargadas,
      ...this.tareasCargadas,
      ...this.librosCargados
    ];

    elementos.forEach(elemento => {
      const fechaEncontrada =
        elemento.fechaCreacion ??
        elemento.creadaEn ??
        elemento.createdAt ??
        elemento.fecha ??
        elemento.fechaActualizacion ??
        elemento.fechaLimite ??
        elemento.fechaExamen ??
        elemento.fechaLlamado;

      const fechaNormalizada =
        this.normalizarFecha(fechaEncontrada);

      if (fechaNormalizada) {
        fechasEnfoque.add(fechaNormalizada);
      }
    });

    this.diasEnfoque = fechasEnfoque.size;
  }

  /* =====================================================
     NORMALIZACIÓN DE FECHAS
     ===================================================== */

  private normalizarFecha(
    fecha: FechaCompatible
  ): string | null {

    if (!fecha) {
      return null;
    }

    /*
     * Cuando la fecha es un texto con formato ISO:
     *
     * 2026-07-17T12:30:00
     *
     * Conservamos únicamente:
     *
     * 2026-07-17
     */
    if (typeof fecha === 'string') {
      return fecha.substring(0, 10);
    }

    /*
     * Los Timestamp de Firestore tienen el método toDate().
     */
    if (this.esTimestampFirestore(fecha)) {
      return this.formatearFechaLocal(fecha.toDate());
    }

    if (fecha instanceof Date) {
      return this.formatearFechaLocal(fecha);
    }

    return null;
  }

  private esTimestampFirestore(
    fecha: FechaCompatible
  ): fecha is { toDate: () => Date } {

    return (
      typeof fecha === 'object' &&
      fecha !== null &&
      'toDate' in fecha &&
      typeof fecha.toDate === 'function'
    );
  }

  private formatearFechaLocal(fecha: Date): string {
    /*
     * No usamos toISOString() porque trabaja en UTC.
     *
     * Cerca de la medianoche podría devolver un día distinto
     * al día local del usuario.
     */
    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private obtenerTiempoFecha(
    fecha: FechaCompatible
  ): number {

    if (!fecha) {
      return Number.MAX_SAFE_INTEGER;
    }

    if (typeof fecha === 'string') {
      const tiempo = new Date(fecha).getTime();

      return Number.isNaN(tiempo)
        ? Number.MAX_SAFE_INTEGER
        : tiempo;
    }

    if (this.esTimestampFirestore(fecha)) {
      return fecha.toDate().getTime();
    }

    if (fecha instanceof Date) {
      return fecha.getTime();
    }

    return Number.MAX_SAFE_INTEGER;
  }

  /* =====================================================
     PRESENTACIÓN DE MATERIAS
     ===================================================== */

  getProgresoMateria(
    estado: EstadoMateria
  ): number {

    switch (estado) {
      case 'cursando':
        return 65;

      case 'regular':
        return 85;

      case 'a_rendir':
        return 30;

      case 'aprobada':
        return 100;

      default:
        return 0;
    }
  }

  getColorMateria(
    estado: EstadoMateria
  ): string {

    switch (estado) {
      case 'cursando':
        return '#4A9EFF';

      case 'regular':
        return '#A78BFA';

      case 'a_rendir':
        return '#FBBF24';

      case 'aprobada':
        return '#34D399';

      default:
        return '#4A9EFF';
    }
  }

  getNombreEstadoMateria(
    estado: EstadoMateria
  ): string {

    switch (estado) {
      case 'cursando':
        return 'Cursando';

      case 'regular':
        return 'Regular';

      case 'a_rendir':
        return 'A rendir';

      case 'aprobada':
        return 'Aprobada';

      case 'abandonada':
        return 'Abandonada';

      default:
        return 'Sin estado';
    }
  }

  getProximaFechaMateria(
    materia: Materia
  ): { label: string; fecha: string } | null {

    if (materia.fechaLlamado) {
      return {
        label: 'Próximo final',
        fecha: materia.fechaLlamado
      };
    }

    if (materia.fechaExamen) {
      return {
        label: 'Próximo parcial',
        fecha: materia.fechaExamen
      };
    }

    if (materia.diaHorario) {
      return {
        label: 'Horario',
        fecha: materia.diaHorario
      };
    }

    return null;
  }
}