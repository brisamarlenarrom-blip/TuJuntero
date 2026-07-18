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

import {
  DocumentoConId,
  FirestoreService
} from '../../../../core/firestore.service';

import { AuthService } from '../../../../core/auth.service';

import {
  EmptyStateComponent
} from '../../../../shared/ui/empty-state/empty-state.component';


/* =====================================================
   TIPOS DE LA BIBLIOTECA
   ===================================================== */

/*
 * Estados posibles de lectura.
 */
type EstadoLectura =
  | 'quiero_leer'
  | 'leyendo'
  | 'leido';

/*
 * Categorías disponibles.
 *
 * Los libros bíblicos se cargan automáticamente.
 * Los libros personales los agrega el usuario.
 */
type CategoriaLibro =
  | 'Biblia'
  | 'Personal';

/*
 * Testamento al que pertenece un libro bíblico.
 */
type TestamentoBiblico =
  | 'Antiguo Testamento'
  | 'Nuevo Testamento';

/*
 * Filtros disponibles en la pantalla.
 */
type FiltroBiblioteca =
  | 'todos'
  | 'favoritos'
  | EstadoLectura;

/*
 * Estructura de un libro almacenado en Firestore.
 */
interface LibroDatos {
  usuarioId: string;

  titulo: string;
  autor: string;

  categoria: CategoriaLibro;
  estadoLectura: EstadoLectura;

  favorito: boolean;
  puntuacion: number;
  resenia: string;

  /*
   * Estos campos se utilizan principalmente
   * en los libros de la Biblia.
   */
  testamento?: TestamentoBiblico;
  orden?: number;

  fechaCreacion: Date;
}

/*
 * Documento obtenido desde Firestore.
 *
 * DocumentoConId agrega el identificador del documento.
 */
type Libro = DocumentoConId<LibroDatos>;

/*
 * Estructura utilizada para crear la biblioteca bíblica.
 */
interface LibroBiblicoBase {
  titulo: string;
  testamento: TestamentoBiblico;
  orden: number;
}


/* =====================================================
   COMPONENTE
   ===================================================== */

@Component({
  selector: 'app-biblioteca',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    EmptyStateComponent
  ],

  templateUrl: './biblioteca.component.html',
  styleUrl: './biblioteca.component.css'
})
export class BibliotecaComponent implements OnInit {

  /* =====================================================
     ESTADO GENERAL
     ===================================================== */

  libros: Libro[] = [];

  mostrarForm = false;
  editando = false;

  libroEditId: string | null = null;
  usuarioId = '';

  filtroActivo: FiltroBiblioteca = 'todos';

  cargando = false;
  guardando = false;
  cargandoBiblia = false;

  eliminandoId: string | null = null;
  actualizandoId: string | null = null;

  mensaje = '';
  mensajeError = '';


  /* =====================================================
     FORMULARIO REACTIVO
     ===================================================== */

  /*
   * nonNullable evita que los controles devuelvan null.
   */
  readonly libroForm;

  constructor(
    private readonly fs: FirestoreService,
    private readonly auth: AuthService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {
    this.libroForm = this.fb.nonNullable.group({
      titulo: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(120)
        ]
      ],

      autor: [
        '',
        Validators.maxLength(100)
      ],

      estadoLectura: [
        'quiero_leer' as EstadoLectura,
        Validators.required
      ],

      puntuacion: [
        0,
        [
          Validators.min(0),
          Validators.max(5)
        ]
      ],

      resenia: [
        '',
        Validators.maxLength(1000)
      ]
    });
  }


  /* =====================================================
     LIBROS DE LA BIBLIA
     ===================================================== */

  /*
   * Los 66 libros se preparan localmente.
   *
   * Luego se guardan en Firestore solamente aquellos
   * que todavía no existen en la biblioteca del usuario.
   */
  readonly librosBiblia: LibroBiblicoBase[] = [
    ...[
      'Génesis',
      'Éxodo',
      'Levítico',
      'Números',
      'Deuteronomio',
      'Josué',
      'Jueces',
      'Rut',
      '1 Samuel',
      '2 Samuel',
      '1 Reyes',
      '2 Reyes',
      '1 Crónicas',
      '2 Crónicas',
      'Esdras',
      'Nehemías',
      'Ester',
      'Job',
      'Salmos',
      'Proverbios',
      'Eclesiastés',
      'Cantares',
      'Isaías',
      'Jeremías',
      'Lamentaciones',
      'Ezequiel',
      'Daniel',
      'Oseas',
      'Joel',
      'Amós',
      'Abdías',
      'Jonás',
      'Miqueas',
      'Nahúm',
      'Habacuc',
      'Sofonías',
      'Hageo',
      'Zacarías',
      'Malaquías'
    ].map(
      (titulo, indice): LibroBiblicoBase => ({
        titulo,
        testamento: 'Antiguo Testamento',
        orden: indice + 1
      })
    ),

    ...[
      'Mateo',
      'Marcos',
      'Lucas',
      'Juan',
      'Hechos',
      'Romanos',
      '1 Corintios',
      '2 Corintios',
      'Gálatas',
      'Efesios',
      'Filipenses',
      'Colosenses',
      '1 Tesalonicenses',
      '2 Tesalonicenses',
      '1 Timoteo',
      '2 Timoteo',
      'Tito',
      'Filemón',
      'Hebreos',
      'Santiago',
      '1 Pedro',
      '2 Pedro',
      '1 Juan',
      '2 Juan',
      '3 Juan',
      'Judas',
      'Apocalipsis'
    ].map(
      (titulo, indice): LibroBiblicoBase => ({
        titulo,
        testamento: 'Nuevo Testamento',
        orden: indice + 40
      })
    )
  ];


  /* =====================================================
     CICLO DE VIDA
     ===================================================== */

  ngOnInit(): void {
    const usuario = this.auth.getUsuarioActual();

    /*
     * Aunque la ruta esté protegida por AuthGuard,
     * igualmente se valida la sesión dentro del componente.
     */
    if (!usuario) {
      this.volver();
      return;
    }

    this.usuarioId = usuario.id;
    this.cargarLibros();
  }


  /* =====================================================
     CONSULTA A FIRESTORE
     ===================================================== */

  cargarLibros(): void {
    if (!this.usuarioId) {
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.fs
      .getByField<LibroDatos>(
        'libros',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        /*
         * La suscripción se elimina automáticamente
         * cuando se destruye el componente.
         */
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: libros => {
          this.libros = this.ordenarLibros(libros);
          this.cargando = false;
        },

        error: error => {
          console.error(
            'No se pudieron cargar los libros:',
            error
          );

          this.libros = [];
          this.cargando = false;

          this.mensajeError =
            'No se pudo cargar la biblioteca. Intentá nuevamente.';
        }
      });
  }


  /* =====================================================
     FILTROS
     ===================================================== */

  get librosFiltrados(): Libro[] {
    switch (this.filtroActivo) {
      case 'favoritos':
        return this.libros.filter(
          libro => libro.favorito
        );

      case 'quiero_leer':
      case 'leyendo':
      case 'leido':
        return this.libros.filter(
          libro =>
            libro.estadoLectura === this.filtroActivo
        );

      case 'todos':
      default:
        return this.libros;
    }
  }

  setFiltro(filtro: FiltroBiblioteca): void {
    this.filtroActivo = filtro;
  }


  /* =====================================================
     CONTADORES
     ===================================================== */

  get totalLibros(): number {
    return this.libros.length;
  }

  get librosFavoritos(): number {
    return this.libros.filter(
      libro => libro.favorito
    ).length;
  }

  get librosQuieroLeer(): number {
    return this.libros.filter(
      libro => libro.estadoLectura === 'quiero_leer'
    ).length;
  }

  get librosLeyendo(): number {
    return this.libros.filter(
      libro => libro.estadoLectura === 'leyendo'
    ).length;
  }

  get librosLeidos(): number {
    return this.libros.filter(
      libro => libro.estadoLectura === 'leido'
    ).length;
  }


  /* =====================================================
     CARGAR BIBLIOTECA BÍBLICA
     ===================================================== */

  async cargarBibliotecaBiblica(): Promise<void> {
    if (!this.usuarioId || this.cargandoBiblia) {
      return;
    }

    this.mensaje = '';
    this.mensajeError = '';

    /*
     * Se identifican los títulos bíblicos que ya existen.
     *
     * Set permite comprobar rápidamente si un libro
     * ya fue cargado.
     */
    const titulosExistentes = new Set(
      this.libros
        .filter(libro => libro.categoria === 'Biblia')
        .map(libro => libro.titulo.trim().toLowerCase())
    );

    const librosFaltantes = this.librosBiblia.filter(
      libro =>
        !titulosExistentes.has(
          libro.titulo.trim().toLowerCase()
        )
    );

    if (librosFaltantes.length === 0) {
      this.mensaje =
        'La biblioteca bíblica ya está completa.';
      return;
    }

    this.cargandoBiblia = true;

    try {
      /*
       * Se crean únicamente los libros que faltan.
       *
       * Promise.all permite realizar las operaciones
       * sin esperar una por una de forma secuencial.
       */
      await Promise.all(
        librosFaltantes.map(libro => {
          const datos: LibroDatos = {
            usuarioId: this.usuarioId,

            titulo: libro.titulo,
            autor: 'Biblia',

            categoria: 'Biblia',
            testamento: libro.testamento,
            orden: libro.orden,

            estadoLectura: 'quiero_leer',
            favorito: false,
            puntuacion: 0,
            resenia: '',

            fechaCreacion: new Date()
          };

          return this.fs.create<LibroDatos>(
            'libros',
            datos
          );
        })
      );

      this.mensaje =
        `${librosFaltantes.length} libros bíblicos fueron agregados correctamente.`;
    } catch (error) {
      console.error(
        'No se pudo cargar la biblioteca bíblica:',
        error
      );

      this.mensajeError =
        'No se pudo completar la biblioteca bíblica.';
    } finally {
      this.cargandoBiblia = false;
    }
  }


  /* =====================================================
     FAVORITOS
     ===================================================== */

  async toggleFavorito(libro: Libro): Promise<void> {
    if (this.actualizandoId === libro.id) {
      return;
    }

    this.actualizandoId = libro.id;
    this.mensajeError = '';

    const nuevoValor = !libro.favorito;

    try {
      await this.fs.update<LibroDatos>(
        'libros',
        libro.id,
        {
          favorito: nuevoValor
        }
      );

      /*
       * Se actualiza el arreglo local para mostrar
       * inmediatamente el nuevo estado.
       */
      this.libros = this.libros.map(libroActual =>
        libroActual.id === libro.id
          ? {
              ...libroActual,
              favorito: nuevoValor
            }
          : libroActual
      );
    } catch (error) {
      console.error(
        'No se pudo modificar el favorito:',
        error
      );

      this.mensajeError =
        'No se pudo modificar el libro favorito.';
    } finally {
      this.actualizandoId = null;
    }
  }


  /* =====================================================
     CAMBIAR ESTADO DE LECTURA
     ===================================================== */

  async cambiarEstado(
    libro: Libro,
    estado: EstadoLectura
  ): Promise<void> {
    if (
      libro.estadoLectura === estado ||
      this.actualizandoId === libro.id
    ) {
      return;
    }

    this.actualizandoId = libro.id;
    this.mensajeError = '';

    try {
      await this.fs.update<LibroDatos>(
        'libros',
        libro.id,
        {
          estadoLectura: estado
        }
      );

      this.libros = this.libros.map(libroActual =>
        libroActual.id === libro.id
          ? {
              ...libroActual,
              estadoLectura: estado
            }
          : libroActual
      );

      this.libros = this.ordenarLibros(this.libros);
    } catch (error) {
      console.error(
        'No se pudo cambiar el estado de lectura:',
        error
      );

      this.mensajeError =
        'No se pudo cambiar el estado de lectura.';
    } finally {
      this.actualizandoId = null;
    }
  }


  /* =====================================================
     CREAR O ACTUALIZAR UN LIBRO
     ===================================================== */

  async guardarLibro(): Promise<void> {
    if (this.libroForm.invalid) {
      this.libroForm.markAllAsTouched();
      return;
    }

    if (!this.usuarioId || this.guardando) {
      return;
    }

    this.guardando = true;
    this.mensaje = '';
    this.mensajeError = '';

    const valores = this.libroForm.getRawValue();

    const tituloLimpio = valores.titulo.trim();
    const autorLimpio = valores.autor.trim();
    const reseniaLimpia = valores.resenia.trim();

    /*
     * Evita guardar títulos compuestos solamente
     * por espacios.
     */
    if (!tituloLimpio) {
      this.libroForm.controls.titulo.setErrors({
        required: true
      });

      this.libroForm.controls.titulo.markAsTouched();
      this.guardando = false;

      return;
    }

    try {
      if (this.editando && this.libroEditId) {
        /*
         * Durante la edición se actualizan solamente
         * los campos modificables.
         *
         * No se reemplazan favorito, categoría,
         * testamento, orden ni fecha de creación.
         */
        await this.fs.update<LibroDatos>(
          'libros',
          this.libroEditId,
          {
            titulo: tituloLimpio,
            autor: autorLimpio,
            estadoLectura: valores.estadoLectura,
            puntuacion: valores.puntuacion,
            resenia: reseniaLimpia
          }
        );

        this.mensaje =
          'El libro fue actualizado correctamente.';
      } else {
        const datos: LibroDatos = {
          usuarioId: this.usuarioId,

          titulo: tituloLimpio,
          autor: autorLimpio,

          categoria: 'Personal',
          estadoLectura: valores.estadoLectura,

          favorito: false,
          puntuacion: valores.puntuacion,
          resenia: reseniaLimpia,

          fechaCreacion: new Date()
        };

        await this.fs.create<LibroDatos>(
          'libros',
          datos
        );

        this.mensaje =
          'El libro fue agregado correctamente.';
      }

      this.cancelar(false);
    } catch (error) {
      console.error(
        'No se pudo guardar el libro:',
        error
      );

      this.mensajeError = this.editando
        ? 'No se pudo actualizar el libro.'
        : 'No se pudo agregar el libro.';
    } finally {
      this.guardando = false;
    }
  }


  /* =====================================================
     EDITAR LIBRO
     ===================================================== */

  editarLibro(libro: Libro): void {
    this.editando = true;
    this.libroEditId = libro.id;
    this.mostrarForm = true;

    this.mensaje = '';
    this.mensajeError = '';

    /*
     * Se cargan únicamente los campos del formulario.
     */
    this.libroForm.setValue({
      titulo: libro.titulo,
      autor: libro.autor ?? '',
      estadoLectura: libro.estadoLectura,
      puntuacion: libro.puntuacion ?? 0,
      resenia: libro.resenia ?? ''
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }


  /* =====================================================
     ELIMINAR LIBRO
     ===================================================== */

  async eliminarLibro(id: string): Promise<void> {
    const confirmacion = window.confirm(
      '¿Seguro que querés eliminar este libro? Esta acción no se puede deshacer.'
    );

    if (!confirmacion) {
      return;
    }

    this.eliminandoId = id;
    this.mensaje = '';
    this.mensajeError = '';

    try {
      await this.fs.delete(
        'libros',
        id
      );

      this.libros = this.libros.filter(
        libro => libro.id !== id
      );

      this.mensaje =
        'El libro fue eliminado correctamente.';
    } catch (error) {
      console.error(
        'No se pudo eliminar el libro:',
        error
      );

      this.mensajeError =
        'No se pudo eliminar el libro.';
    } finally {
      this.eliminandoId = null;
    }
  }


  /* =====================================================
     CONTROL DEL FORMULARIO
     ===================================================== */

  abrirForm(): void {
    this.editando = false;
    this.libroEditId = null;

    this.mensaje = '';
    this.mensajeError = '';

    this.libroForm.reset({
      titulo: '',
      autor: '',
      estadoLectura: 'quiero_leer',
      puntuacion: 0,
      resenia: ''
    });

    this.mostrarForm = true;
  }

  cancelar(limpiarMensajes = true): void {
    this.editando = false;
    this.libroEditId = null;
    this.mostrarForm = false;

    if (limpiarMensajes) {
      this.mensaje = '';
      this.mensajeError = '';
    }

    this.libroForm.reset({
      titulo: '',
      autor: '',
      estadoLectura: 'quiero_leer',
      puntuacion: 0,
      resenia: ''
    });
  }


  /* =====================================================
     HELPERS VISUALES
     ===================================================== */

  getColorEstado(estado: EstadoLectura): string {
    switch (estado) {
      case 'leyendo':
        return '#4A9EFF';

      case 'leido':
        return '#34D399';

      case 'quiero_leer':
      default:
        return '#FBBF24';
    }
  }

  getIconoEstado(estado: EstadoLectura): string {
    switch (estado) {
      case 'leyendo':
        return '📖';

      case 'leido':
        return '✅';

      case 'quiero_leer':
      default:
        return '📚';
    }
  }

  getLabelEstado(estado: EstadoLectura): string {
    switch (estado) {
      case 'leyendo':
        return 'Leyendo';

      case 'leido':
        return 'Leído';

      case 'quiero_leer':
      default:
        return 'Quiero leer';
    }
  }

  /*
   * Devuelve entre cero y cinco estrellas.
   */
  getEstrellas(puntuacion: number): string {
    const valorSeguro = Math.min(
      5,
      Math.max(0, Number(puntuacion) || 0)
    );

    return '⭐'.repeat(valorSeguro);
  }


  /* =====================================================
     ORDENAMIENTO
     ===================================================== */

  private ordenarLibros(libros: Libro[]): Libro[] {
    return [...libros].sort(
      (primerLibro, segundoLibro) => {

        /*
         * Los libros bíblicos se agrupan y se ordenan
         * según su posición dentro de la Biblia.
         */
        if (
          primerLibro.categoria === 'Biblia' &&
          segundoLibro.categoria === 'Biblia'
        ) {
          return (
            (primerLibro.orden ?? 0) -
            (segundoLibro.orden ?? 0)
          );
        }

        /*
         * Primero se muestran los libros bíblicos
         * y después los libros personales.
         */
        if (
          primerLibro.categoria === 'Biblia' &&
          segundoLibro.categoria !== 'Biblia'
        ) {
          return -1;
        }

        if (
          primerLibro.categoria !== 'Biblia' &&
          segundoLibro.categoria === 'Biblia'
        ) {
          return 1;
        }

        /*
         * Los libros personales se ordenan alfabéticamente.
         */
        return primerLibro.titulo.localeCompare(
          segundoLibro.titulo,
          'es',
          {
            sensitivity: 'base'
          }
        );
      }
    );
  }


  /* =====================================================
     OPTIMIZACIÓN DEL LISTADO
     ===================================================== */

  trackByLibroId(
    _index: number,
    libro: Libro
  ): string {
    return libro.id;
  }


  /* =====================================================
     NAVEGACIÓN
     ===================================================== */

  volver(): void {
    void this.router.navigate([
      '/aprender'
    ]);
  }
}