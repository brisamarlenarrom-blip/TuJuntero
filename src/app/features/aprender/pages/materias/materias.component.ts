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

import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

import {
  EmptyStateComponent
} from '../../../../shared/ui/empty-state/empty-state.component';

/* =====================================================
   TIPOS Y MODELOS
   ===================================================== */

/*
 * Estados permitidos para una materia.
 *
 * Al usar este tipo, TypeScript evita que se guarden
 * estados escritos incorrectamente.
 */
type EstadoMateria =
  | 'cursando'
  | 'regular'
  | 'a_rendir';

/*
 * Estructura utilizada para las materias almacenadas
 * en Firestore.
 */
interface Materia {
  id?: string;
  usuarioId: string;

  nombre: string;
  estado: EstadoMateria;

  diaHorario: string;
  fechaLlamado: string;
  fechaExamen: string;
}

/*
 * Datos que se muestran cuando una materia tiene
 * una próxima fecha o un horario.
 */
interface ProximaFechaMateria {
  label: string;
  fecha: string;
}

/* =====================================================
   COMPONENTE
   ===================================================== */

@Component({
  selector: 'app-materias',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    EmptyStateComponent
  ],

  templateUrl: './materias.component.html',
  styleUrl: './materias.component.css'
})
export class MateriasComponent implements OnInit {

  /* =====================================================
     ESTADO DE LA VISTA
     ===================================================== */

  materias: Materia[] = [];

  mostrarForm = false;
  editando = false;

  materiaEditId: string | null = null;
  usuarioId = '';

  /*
   * Estos estados pueden utilizarse en el HTML para
   * mostrar mensajes de carga, desactivar botones o
   * informar errores.
   */
  cargando = false;
  guardando = false;
  mensajeError = '';

  /* =====================================================
     FORMULARIO REACTIVO
     ===================================================== */

  /*
   * nonNullable evita que los controles devuelvan null.
   *
   * El formulario queda tipado automáticamente:
   *
   * nombre: string
   * estado: EstadoMateria
   * diaHorario: string
   * fechaLlamado: string
   * fechaExamen: string
   */
  readonly materiaForm;

  constructor(
    private readonly api: FirestoreService,
    private readonly auth: AuthService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {
    this.materiaForm = this.fb.nonNullable.group({
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(80)
        ]
      ],

      estado: [
        'cursando' as EstadoMateria,
        Validators.required
      ],

      diaHorario: [''],
      fechaLlamado: [''],
      fechaExamen: ['']
    });
  }

  /* =====================================================
     CICLO DE VIDA
     ===================================================== */

  ngOnInit(): void {
    const usuario = this.auth.getUsuarioActual();

    /*
     * El AuthGuard normalmente impide entrar sin sesión.
     * Esta validación se mantiene como protección adicional.
     */
    if (!usuario) {
      this.volver();
      return;
    }

    this.usuarioId = usuario.id;
    this.cargarMaterias();
  }

  /* =====================================================
     CARGA DE MATERIAS
     ===================================================== */

  cargarMaterias(): void {
    if (!this.usuarioId) {
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.api
      .getByField<Materia>(
        'materias',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        /*
         * La suscripción se cancela automáticamente cuando
         * Angular destruye el componente.
         */
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: materias => {
          /*
           * Se ordenan alfabéticamente para mantener una
           * presentación consistente.
           */
          this.materias = [...materias].sort(
            (primeraMateria, segundaMateria) =>
              primeraMateria.nombre.localeCompare(
                segundaMateria.nombre,
                'es',
                { sensitivity: 'base' }
              )
          );

          this.cargando = false;
        },

        error: error => {
          console.error(
            'No se pudieron cargar las materias:',
            error
          );

          this.materias = [];
          this.cargando = false;

          this.mensajeError =
            'No se pudieron cargar las materias. Intentá nuevamente.';
        }
      });
  }

  /* =====================================================
     HELPERS VISUALES
     ===================================================== */

  getColorEstado(estado: EstadoMateria): string {
    switch (estado) {
      case 'cursando':
        return '#4A9EFF';

      case 'regular':
        return '#A78BFA';

      case 'a_rendir':
        return '#FBBF24';

      default:
        return '#4A9EFF';
    }
  }

  getIconoEstado(estado: EstadoMateria): string {
    switch (estado) {
      case 'cursando':
        return '📘';

      case 'regular':
        return '📙';

      case 'a_rendir':
        return '📕';

      default:
        return '📚';
    }
  }

  getLabelEstado(estado: EstadoMateria): string {
    switch (estado) {
      case 'cursando':
        return 'Cursando';

      case 'regular':
        return 'Regular';

      case 'a_rendir':
        return 'A rendir';

      default:
        return 'Sin estado';
    }
  }

  getProximaFecha(
    materia: Materia
  ): ProximaFechaMateria | null {

    /*
     * Se prioriza la fecha del llamado a final.
     * Si no existe, se busca la fecha del parcial.
     * Finalmente se muestra el horario de cursada.
     */
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

  /* =====================================================
     CREAR O ACTUALIZAR UNA MATERIA
     ===================================================== */

  async guardarMateria(): Promise<void> {
    /*
     * markAllAsTouched permite mostrar los errores del
     * formulario cuando el usuario intenta enviarlo vacío.
     */
    if (this.materiaForm.invalid) {
      this.materiaForm.markAllAsTouched();
      return;
    }

    if (!this.usuarioId || this.guardando) {
      return;
    }

    this.guardando = true;
    this.mensajeError = '';

    const valoresFormulario =
      this.materiaForm.getRawValue();

    /*
     * Se utiliza trim() para evitar guardar nombres con
     * espacios innecesarios al principio o al final.
     */
    const datos: Materia = {
      usuarioId: this.usuarioId,

      nombre: valoresFormulario.nombre.trim(),
      estado: valoresFormulario.estado,

      diaHorario: valoresFormulario.diaHorario.trim(),
      fechaLlamado: valoresFormulario.fechaLlamado,
      fechaExamen: valoresFormulario.fechaExamen
    };

    /*
     * Una cadena formada únicamente por espacios supera
     * algunas validaciones básicas. Por eso hacemos esta
     * comprobación después de aplicar trim().
     */
    if (!datos.nombre) {
      this.materiaForm.controls.nombre.setErrors({
        required: true
      });

      this.materiaForm.controls.nombre.markAsTouched();
      this.guardando = false;

      return;
    }

    try {
      if (this.editando && this.materiaEditId) {
        await this.api.update<Materia>(
          'materias',
          this.materiaEditId,
          datos
        );
      } else {
        await this.api.create<Materia>(
          'materias',
          datos
        );
      }

      this.cancelar();

      /*
       * Si getByField utiliza valueChanges(), Firestore
       * actualizará automáticamente la lista.
       *
       * La recarga se conserva para que también funcione
       * si el servicio realiza una consulta de una sola vez.
       */
      this.cargarMaterias();
    } catch (error) {
      console.error(
        'No se pudo guardar la materia:',
        error
      );

      this.mensajeError =
        this.editando
          ? 'No se pudo actualizar la materia.'
          : 'No se pudo crear la materia.';
    } finally {
      this.guardando = false;
    }
  }

  /* =====================================================
     EDITAR UNA MATERIA
     ===================================================== */

  editarMateria(materia: Materia): void {
    if (!materia.id) {
      console.error(
        'No se puede editar una materia sin identificador.'
      );

      this.mensajeError =
        'No se pudo seleccionar la materia para editar.';

      return;
    }

    this.editando = true;
    this.materiaEditId = materia.id;
    this.mostrarForm = true;
    this.mensajeError = '';

    /*
     * Se cargan únicamente los valores que pertenecen
     * al formulario. No se envían el id ni el usuarioId.
     */
    this.materiaForm.setValue({
      nombre: materia.nombre,
      estado: materia.estado,
      diaHorario: materia.diaHorario ?? '',
      fechaLlamado: materia.fechaLlamado ?? '',
      fechaExamen: materia.fechaExamen ?? ''
    });

    /*
     * Lleva al usuario hacia el formulario en caso de
     * que la tarjeta seleccionada esté más abajo.
     */
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /* =====================================================
     ELIMINAR UNA MATERIA
     ===================================================== */

  async eliminarMateria(id: string | undefined): Promise<void> {
    if (!id) {
      this.mensajeError =
        'No se pudo identificar la materia que querés eliminar.';

      return;
    }

    const confirmacion = window.confirm(
      '¿Seguro que querés eliminar esta materia? Esta acción no se puede deshacer.'
    );

    if (!confirmacion) {
      return;
    }

    this.mensajeError = '';

    try {
      await this.api.delete(
        'materias',
        id
      );

      /*
       * Se actualiza inmediatamente el arreglo local.
       * Esto hace que la interfaz responda sin esperar
       * una nueva consulta a Firestore.
       */
      this.materias = this.materias.filter(
        materia => materia.id !== id
      );

      this.cargarMaterias();
    } catch (error) {
      console.error(
        'No se pudo eliminar la materia:',
        error
      );

      this.mensajeError =
        'No se pudo eliminar la materia. Intentá nuevamente.';
    }
  }

  /* =====================================================
     APERTURA Y CIERRE DEL FORMULARIO
     ===================================================== */

  abrirForm(): void {
    this.editando = false;
    this.materiaEditId = null;
    this.mensajeError = '';

    this.materiaForm.reset({
      nombre: '',
      estado: 'cursando',
      diaHorario: '',
      fechaLlamado: '',
      fechaExamen: ''
    });

    this.mostrarForm = true;
  }

  cancelar(): void {
    this.editando = false;
    this.materiaEditId = null;
    this.mostrarForm = false;
    this.mensajeError = '';

    this.materiaForm.reset({
      nombre: '',
      estado: 'cursando',
      diaHorario: '',
      fechaLlamado: '',
      fechaExamen: ''
    });
  }

  /* =====================================================
     NAVEGACIÓN
     ===================================================== */

  volver(): void {
    void this.router.navigate(['/aprender']);
  }

  /* =====================================================
     OPTIMIZACIÓN DEL *ngFor
     ===================================================== */

  trackByMateriaId(
    index: number,
    materia: Materia
  ): string {

    /*
     * Angular puede reutilizar la tarjeta existente en lugar
     * de volver a crear toda la lista cuando hay cambios.
     */
    return materia.id ?? `${materia.nombre}-${index}`;
  }
}