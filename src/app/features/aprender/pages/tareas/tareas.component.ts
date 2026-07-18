import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterModule
} from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/* Angular Material */
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

/* Servicios */
import {
  DocumentoConId,
  FirestoreService
} from '../../../../core/firestore.service';

import { AuthService } from '../../../../core/auth.service';

/* Componentes compartidos */
import {
  EmptyStateComponent
} from '../../../../shared/ui/empty-state/empty-state.component';


/* =====================================================
   TIPOS DEL COMPONENTE
   ===================================================== */

/*
 * Tipos de actividad que puede registrar el usuario.
 */
type TipoTarea =
  | 'tarea'
  | 'examen'
  | 'parcial'
  | 'final'
  | 'entrega';

/*
 * Prioridades disponibles.
 */
type PrioridadTarea =
  | 'baja'
  | 'media'
  | 'alta';

/*
 * Estados permitidos para una tarea.
 */
type EstadoTarea =
  | 'pendiente'
  | 'en_progreso'
  | 'completada';

/*
 * Filtros disponibles en la interfaz.
 */
type FiltroTarea =
  | 'todas'
  | 'pendientes'
  | 'completadas';

/*
 * Datos almacenados dentro del documento de Firestore.
 *
 * El identificador no se incluye porque Firestore lo
 * agrega automáticamente mediante DocumentoConId<T>.
 */
interface TareaDatos {
  usuarioId: string;

  titulo: string;
  descripcion: string;

  tipo: TipoTarea;
  fechaLimite: string;
  prioridad: PrioridadTarea;
  estado: EstadoTarea;
}

/*
 * Documento completo recuperado desde Firestore.
 *
 * Incluye todos los campos de TareaDatos más el id.
 */
type Tarea = DocumentoConId<TareaDatos>;


/* =====================================================
   COMPONENTE
   ===================================================== */

@Component({
  selector: 'app-tareas',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,

    EmptyStateComponent
  ],

  templateUrl: './tareas.component.html',
  styleUrl: './tareas.component.css'
})
export class TareasComponent implements OnInit {

  /* =====================================================
     ESTADO GENERAL
     ===================================================== */

  tareas: Tarea[] = [];

  mostrarForm = false;
  editando = false;

  tareaEditId: string | null = null;
  usuarioId = '';

  filtroActivo: FiltroTarea = 'todas';

  /*
   * Estados utilizados por el HTML para informar al usuario.
   */
  cargando = false;
  guardando = false;
  eliminandoId: string | null = null;

  mensajeError = '';


  /* =====================================================
     FORMULARIO REACTIVO
     ===================================================== */

  /*
   * nonNullable evita que los controles entreguen null.
   *
   * TypeScript infiere automáticamente el tipo de cada
   * campo del formulario.
   */
  readonly tareaForm;

  constructor(
    private readonly fs: FirestoreService,
    private readonly auth: AuthService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {
    this.tareaForm = this.fb.nonNullable.group({
      titulo: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100)
        ]
      ],

      descripcion: [
        '',
        Validators.maxLength(500)
      ],

      tipo: [
        'tarea' as TipoTarea,
        Validators.required
      ],

      fechaLimite: [''],

      prioridad: [
        'media' as PrioridadTarea,
        Validators.required
      ],

      estado: [
        'pendiente' as EstadoTarea,
        Validators.required
      ]
    });
  }


  /* =====================================================
     CICLO DE VIDA
     ===================================================== */

  ngOnInit(): void {
    const usuario = this.auth.getUsuarioActual();

    /*
     * Aunque el AuthGuard protege la ruta, esta validación
     * evita realizar consultas si no hay una sesión válida.
     */
    if (!usuario) {
      this.volver();
      return;
    }

    this.usuarioId = usuario.id;
    this.cargarTareas();
  }


  /* =====================================================
     CARGA DE TAREAS
     ===================================================== */

  cargarTareas(): void {
    if (!this.usuarioId) {
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.fs
      .getByField<TareaDatos>(
        'tareas',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        /*
         * La suscripción se cancela automáticamente cuando
         * el componente deja de existir.
         */
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: tareas => {
          this.tareas = this.ordenarTareas(tareas);
          this.cargando = false;
        },

        error: error => {
          console.error(
            'No se pudieron cargar las tareas:',
            error
          );

          this.tareas = [];
          this.cargando = false;

          this.mensajeError =
            'No se pudieron cargar las tareas. Intentá nuevamente.';
        }
      });
  }


  /* =====================================================
     FILTRADO
     ===================================================== */

  get tareasFiltradas(): Tarea[] {
    switch (this.filtroActivo) {
      case 'pendientes':
        return this.tareas.filter(
          tarea =>
            tarea.estado === 'pendiente' ||
            tarea.estado === 'en_progreso'
        );

      case 'completadas':
        return this.tareas.filter(
          tarea => tarea.estado === 'completada'
        );

      case 'todas':
      default:
        return this.tareas;
    }
  }

  setFiltro(filtro: FiltroTarea): void {
    this.filtroActivo = filtro;
  }

  /*
   * Permiten mostrar cantidades en cada filtro.
   */
  get cantidadPendientes(): number {
    return this.tareas.filter(
      tarea =>
        tarea.estado === 'pendiente' ||
        tarea.estado === 'en_progreso'
    ).length;
  }

  get cantidadCompletadas(): number {
    return this.tareas.filter(
      tarea => tarea.estado === 'completada'
    ).length;
  }


  /* =====================================================
     HELPERS VISUALES
     ===================================================== */

  getIconoTipo(tipo: TipoTarea): string {
    switch (tipo) {
      case 'examen':
        return '📝';

      case 'parcial':
        return '📋';

      case 'final':
        return '🎓';

      case 'entrega':
        return '📦';

      case 'tarea':
      default:
        return '✅';
    }
  }

  getColorTipo(tipo: TipoTarea): string {
    switch (tipo) {
      case 'examen':
        return '#A78BFA';

      case 'parcial':
        return '#60A5FA';

      case 'final':
        return '#F59E0B';

      case 'entrega':
        return '#34D399';

      case 'tarea':
      default:
        return '#4A9EFF';
    }
  }

  getLabelTipo(tipo: TipoTarea): string {
    switch (tipo) {
      case 'tarea':
        return 'Tarea';

      case 'examen':
        return 'Examen';

      case 'parcial':
        return 'Parcial';

      case 'final':
        return 'Final';

      case 'entrega':
        return 'Entrega';

      default:
        return 'Actividad';
    }
  }

  getLabelEstado(estado: EstadoTarea): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';

      case 'en_progreso':
        return 'En proceso';

      case 'completada':
        return 'Completada';

      default:
        return 'Sin estado';
    }
  }

  /*
   * Devuelve el nombre de la clase CSS que corresponde
   * al estado de la tarea.
   */
  getColorEstado(estado: EstadoTarea): string {
    switch (estado) {
      case 'pendiente':
        return 'badge-azul';

      case 'en_progreso':
        return 'badge-violeta';

      case 'completada':
        return 'badge-verde';

      default:
        return 'badge-gris';
    }
  }

  getLabelPrioridad(prioridad: PrioridadTarea): string {
    switch (prioridad) {
      case 'baja':
        return 'Baja';

      case 'media':
        return 'Media';

      case 'alta':
        return 'Alta';

      default:
        return 'Sin prioridad';
    }
  }

  getClasePrioridad(prioridad: PrioridadTarea): string {
    switch (prioridad) {
      case 'baja':
        return 'prioridad-baja';

      case 'media':
        return 'prioridad-media';

      case 'alta':
        return 'prioridad-alta';

      default:
        return '';
    }
  }

  /*
   * Convierte una fecha con formato YYYY-MM-DD a una
   * fecha más cómoda para mostrar en la interfaz.
   *
   * Se agregan las partes manualmente para evitar que
   * el huso horario cambie el día.
   */
  formatearFecha(fecha: string): string {
    if (!fecha) {
      return 'Sin fecha límite';
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    const [anio, mes, dia] = partes;

    return `${dia}/${mes}/${anio}`;
  }


  /* =====================================================
     CREAR O ACTUALIZAR
     ===================================================== */

  async guardarTarea(): Promise<void> {
    if (this.tareaForm.invalid) {
      this.tareaForm.markAllAsTouched();
      return;
    }

    if (!this.usuarioId || this.guardando) {
      return;
    }

    this.guardando = true;
    this.mensajeError = '';

    const valores = this.tareaForm.getRawValue();

    const datos: TareaDatos = {
      usuarioId: this.usuarioId,

      titulo: valores.titulo.trim(),
      descripcion: valores.descripcion.trim(),

      tipo: valores.tipo,
      fechaLimite: valores.fechaLimite,
      prioridad: valores.prioridad,
      estado: valores.estado
    };

    /*
     * Evita guardar un título formado solamente por espacios.
     */
    if (!datos.titulo) {
      this.tareaForm.controls.titulo.setErrors({
        required: true
      });

      this.tareaForm.controls.titulo.markAsTouched();
      this.guardando = false;

      return;
    }

    try {
      if (this.editando && this.tareaEditId) {
        await this.fs.update<TareaDatos>(
          'tareas',
          this.tareaEditId,
          datos
        );
      } else {
        await this.fs.create<TareaDatos>(
          'tareas',
          datos
        );
      }

      this.cancelar();
      this.cargarTareas();
    } catch (error) {
      console.error(
        'No se pudo guardar la tarea:',
        error
      );

      this.mensajeError = this.editando
        ? 'No se pudo actualizar la tarea.'
        : 'No se pudo crear la tarea.';
    } finally {
      this.guardando = false;
    }
  }


  /* =====================================================
     EDITAR
     ===================================================== */

  editarTarea(tarea: Tarea): void {
    this.editando = true;
    this.tareaEditId = tarea.id;
    this.mostrarForm = true;
    this.mensajeError = '';

    /*
     * Se cargan solamente los campos del formulario.
     * No se colocan el id ni el usuarioId.
     */
    this.tareaForm.setValue({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion ?? '',
      tipo: tarea.tipo,
      fechaLimite: tarea.fechaLimite ?? '',
      prioridad: tarea.prioridad,
      estado: tarea.estado
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }


  /* =====================================================
     ELIMINAR
     ===================================================== */

  async eliminarTarea(id: string): Promise<void> {
    const confirmacion = window.confirm(
      '¿Seguro que querés eliminar esta tarea? Esta acción no se puede deshacer.'
    );

    if (!confirmacion) {
      return;
    }

    this.eliminandoId = id;
    this.mensajeError = '';

    try {
      await this.fs.delete(
        'tareas',
        id
      );

      /*
       * Actualización inmediata de la interfaz.
       */
      this.tareas = this.tareas.filter(
        tarea => tarea.id !== id
      );
    } catch (error) {
      console.error(
        'No se pudo eliminar la tarea:',
        error
      );

      this.mensajeError =
        'No se pudo eliminar la tarea. Intentá nuevamente.';
    } finally {
      this.eliminandoId = null;
    }
  }


  /* =====================================================
     CAMBIO RÁPIDO DE ESTADO
     ===================================================== */

  async cambiarEstado(
    tarea: Tarea,
    nuevoEstado: EstadoTarea
  ): Promise<void> {
    if (tarea.estado === nuevoEstado) {
      return;
    }

    this.mensajeError = '';

    try {
      await this.fs.update<TareaDatos>(
        'tareas',
        tarea.id,
        {
          estado: nuevoEstado
        }
      );

      /*
       * Se modifica la tarea local para que el cambio
       * aparezca inmediatamente en pantalla.
       */
      this.tareas = this.tareas.map(tareaActual =>
        tareaActual.id === tarea.id
          ? {
              ...tareaActual,
              estado: nuevoEstado
            }
          : tareaActual
      );

      this.tareas = this.ordenarTareas(this.tareas);
    } catch (error) {
      console.error(
        'No se pudo cambiar el estado de la tarea:',
        error
      );

      this.mensajeError =
        'No se pudo modificar el estado de la tarea.';
    }
  }


  /* =====================================================
     FORMULARIO
     ===================================================== */

  abrirForm(): void {
    this.editando = false;
    this.tareaEditId = null;
    this.mensajeError = '';

    this.tareaForm.reset({
      titulo: '',
      descripcion: '',
      tipo: 'tarea',
      fechaLimite: '',
      prioridad: 'media',
      estado: 'pendiente'
    });

    this.mostrarForm = true;
  }

  cancelar(): void {
    this.editando = false;
    this.tareaEditId = null;
    this.mostrarForm = false;
    this.mensajeError = '';

    this.tareaForm.reset({
      titulo: '',
      descripcion: '',
      tipo: 'tarea',
      fechaLimite: '',
      prioridad: 'media',
      estado: 'pendiente'
    });
  }


  /* =====================================================
     ORDENAMIENTO
     ===================================================== */

  private ordenarTareas(tareas: Tarea[]): Tarea[] {
    return [...tareas].sort(
      (primeraTarea, segundaTarea) => {

        /*
         * Las tareas sin completar se muestran antes que
         * las tareas completadas.
         */
        if (
          primeraTarea.estado === 'completada' &&
          segundaTarea.estado !== 'completada'
        ) {
          return 1;
        }

        if (
          primeraTarea.estado !== 'completada' &&
          segundaTarea.estado === 'completada'
        ) {
          return -1;
        }

        /*
         * Las tareas que tienen fecha límite se muestran
         * antes que las que no tienen fecha.
         */
        if (
          primeraTarea.fechaLimite &&
          !segundaTarea.fechaLimite
        ) {
          return -1;
        }

        if (
          !primeraTarea.fechaLimite &&
          segundaTarea.fechaLimite
        ) {
          return 1;
        }

        /*
         * Como las fechas utilizan YYYY-MM-DD, pueden
         * compararse directamente como texto.
         */
        if (
          primeraTarea.fechaLimite &&
          segundaTarea.fechaLimite
        ) {
          return primeraTarea.fechaLimite.localeCompare(
            segundaTarea.fechaLimite
          );
        }

        return primeraTarea.titulo.localeCompare(
          segundaTarea.titulo,
          'es',
          {
            sensitivity: 'base'
          }
        );
      }
    );
  }


  /* =====================================================
     OPTIMIZACIÓN DE LISTAS
     ===================================================== */

  trackByTareaId(
    _index: number,
    tarea: Tarea
  ): string {
    return tarea.id;
  }


  /* =====================================================
     NAVEGACIÓN
     ===================================================== */

  abrirAsistente(): void {
    void this.router.navigate([
      '/aprender/asistente'
    ]);
  }

  volver(): void {
    void this.router.navigate([
      '/aprender'
    ]);
  }
}