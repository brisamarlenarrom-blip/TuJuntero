// ==========================================================
// DASHBOARD DE PERFIL
// Resume la información, actividad, ánimo y logros del usuario.
// ==========================================================

import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Servicios propios
import { AuthService } from '../../../../core/auth.service';
import { FirestoreService } from '../../../../core/firestore.service';


// ==========================================================
// TIPOS E INTERFACES
// ==========================================================

/**
 * Roles disponibles dentro de la aplicación.
 */
type RolUsuario = 'usuario' | 'mentor' | 'admin';

/**
 * Estados posibles de una tarea.
 */
type EstadoTarea =
  | 'pendiente'
  | 'proceso'
  | 'completada';

/**
 * Estados de lectura utilizados en Biblioteca.
 */
type EstadoLectura =
  | 'quiero_leer'
  | 'leyendo'
  | 'leido';

/**
 * Información mínima que se utiliza del usuario autenticado.
 */
interface UsuarioPerfil {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: RolUsuario;
}

/**
 * Estructura mínima de una tarea guardada en Firestore.
 */
interface TareaPerfil {
  usuarioId: string;
  estado?: EstadoTarea;
}

/**
 * Estructura mínima de un entrenamiento.
 */
interface EntrenamientoPerfil {
  usuarioId: string;
  fecha?: unknown;
  duracion?: number | string;
}

/**
 * Estructura mínima de una receta.
 */
interface RecetaPerfil {
  usuarioId: string;
  favorita?: boolean;
}

/**
 * Estructura mínima de un libro.
 */
interface LibroPerfil {
  usuarioId: string;
  estadoLectura?: EstadoLectura;
}

/**
 * Registro diario del estado de ánimo.
 */
interface AnimoPerfil {
  usuarioId: string;
  fecha?: unknown;
  valor?: number | string;
}

/**
 * Opción disponible dentro del menú del perfil.
 */
interface OpcionPerfil {
  icono: string;
  titulo: string;
  sub: string;
  ruta: string;
}

/**
 * Logro que puede mostrarse bloqueado o desbloqueado.
 */
interface LogroPerfil {
  icono: string;
  titulo: string;
  sub: string;
  color: string;
  desbloqueado: boolean;
}

/**
 * Registro de ánimo ya normalizado para utilizar en la vista.
 */
interface AnimoNormalizado {
  fecha: string;
  valor: number;
}


@Component({
  selector: 'app-dashboard-perfil',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule
  ],

  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // ========================================================
  // INYECCIÓN DE DEPENDENCIAS
  // ========================================================

  private readonly firestoreService =
    inject(FirestoreService);

  private readonly authService =
    inject(AuthService);

  /**
   * Permite cerrar automáticamente las suscripciones
   * cuando el componente deja de existir.
   */
  private readonly destroyRef =
    inject(DestroyRef);


  // ========================================================
  // INFORMACIÓN DEL USUARIO
  // ========================================================

  nombre = '';
  apellido = '';
  email = '';
  usuarioId = '';

  esAdmin = false;


  // ========================================================
  // ESTADO DE LA PANTALLA
  // ========================================================

  cargandoStats = false;
  cargandoAnimos = false;

  mensajeError = '';


  // ========================================================
  // ESTADÍSTICAS
  // ========================================================

  diasSeguidos = 0;
  tareasCompletadas = 0;
  minutosEntrenados = 0;
  recetasFavoritas = 0;


  // ========================================================
  // ÁNIMO DEL MES
  // ========================================================

  animosMes: AnimoNormalizado[] = [];

  promedioAnimo = 0;
  diasRegistrados = 0;
  emojiPromedio = '🙂';


  // ========================================================
  // FRASES MOTIVACIONALES
  // ========================================================

  readonly frases: string[] = [
    '"Pequeños pasos todos los días, grandes cambios siempre." 💙',
    '"El éxito es la suma de pequeños esfuerzos repetidos cada día." 🔥',
    '"Crecer es incómodo, pero quedarse quieto es peor." ⚡'
  ];

  fraseDelDia = '';


  // ========================================================
  // LOGROS
  // ========================================================

  readonly logros: LogroPerfil[] = [
    {
      icono: '🔥',
      titulo: '7 días seguidos',
      sub: 'Racha',
      color: '#F59E0B',
      desbloqueado: false
    },
    {
      icono: '🏋️',
      titulo: 'Primera rutina',
      sub: '¡Bien hecho!',
      color: '#8B5CF6',
      desbloqueado: false
    },
    {
      icono: '📚',
      titulo: '10 tareas',
      sub: 'Completadas',
      color: '#4A9EFF',
      desbloqueado: false
    },
    {
      icono: '⭐',
      titulo: '5 libros leídos',
      sub: 'Excelente',
      color: '#F59E0B',
      desbloqueado: false
    },
    {
      icono: '❤️',
      titulo: 'Constancia',
      sub: 'No te rendís',
      color: '#EF4444',
      desbloqueado: false
    },
    {
      icono: '💧',
      titulo: 'Hidratado',
      sub: '10 días',
      color: '#34D399',
      desbloqueado: false
    }
  ];


  // ========================================================
  // OPCIONES DEL PERFIL
  // ========================================================

  /**
   * Las opciones comunes aparecen para todos los usuarios.
   * El panel de administración se agrega solamente
   * cuando el usuario posee el rol admin.
   */
  get opciones(): OpcionPerfil[] {
    const opcionesBase: OpcionPerfil[] = [
      {
        icono: '👤',
        titulo: 'Editar perfil',
        sub: 'Actualizá tu información',
        ruta: '/perfil/editar'
      },
      {
        icono: '⚙️',
        titulo: 'Configuración',
        sub: 'Preferencias de la app',
        ruta: '/perfil/configuracion'
      },
      {
        icono: '🔔',
        titulo: 'Notificaciones',
        sub: 'Administrá alertas',
        ruta: '/perfil/notificaciones'
      }
    ];

    if (this.esAdmin) {
      opcionesBase.push({
        icono: '🛡️',
        titulo: 'Panel Admin',
        sub: 'Gestionar mentores',
        ruta: '/admin/mentores'
      });
    }

    return opcionesBase;
  }


  // ========================================================
  // CICLO DE VIDA
  // ========================================================

  ngOnInit(): void {
    const usuarioEncontrado =
      this.authService.getUsuarioActual() as UsuarioPerfil | null;

    if (!usuarioEncontrado?.id) {
      this.mensajeError =
        'No fue posible identificar al usuario actual.';

      return;
    }

    this.cargarDatosUsuario(usuarioEncontrado);
    this.seleccionarFraseDelDia();

    this.cargarStats();
    this.cargarAnimosMes();
  }


  // ========================================================
  // CARGA DE ESTADÍSTICAS
  // ========================================================

  /**
   * Inicia la carga de los diferentes indicadores
   * que aparecen en el dashboard.
   */
  cargarStats(): void {
    if (!this.usuarioId) {
      return;
    }

    this.cargandoStats = true;
    this.mensajeError = '';

    this.cargarTareas();
    this.cargarEntrenamientos();
    this.cargarRecetasFavoritas();
    this.cargarLibrosLeidos();
  }

  /**
   * Cuenta solamente las tareas completadas.
   */
  private cargarTareas(): void {
    this.firestoreService
      .getByField<TareaPerfil>(
        'tareas',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: tareas => {
          this.tareasCompletadas = tareas.filter(
            tarea => tarea.estado === 'completada'
          ).length;

          this.actualizarLogro(
            2,
            this.tareasCompletadas >= 10
          );
        },
        error: error => {
          this.registrarError(
            'No se pudieron cargar las tareas.',
            error
          );
        }
      });
  }

  /**
   * Suma los minutos entrenados durante los últimos
   * siete días y desbloquea el logro de primera rutina.
   */
  private cargarEntrenamientos(): void {
    this.firestoreService
      .getByField<EntrenamientoPerfil>(
        'entrenamientos',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: entrenamientos => {
          const inicioPeriodo =
            this.obtenerFechaHaceSieteDias();

          const entrenamientosSemana =
            entrenamientos.filter(entrenamiento => {
              const fecha =
                this.convertirAFecha(entrenamiento.fecha);

              return Boolean(
                fecha && fecha >= inicioPeriodo
              );
            });

          this.minutosEntrenados =
            entrenamientosSemana.reduce(
              (total, entrenamiento) => {
                return total +
                  this.convertirANumero(
                    entrenamiento.duracion
                  );
              },
              0
            );

          this.actualizarLogro(
            1,
            entrenamientosSemana.length > 0
          );

          this.cargandoStats = false;
        },
        error: error => {
          this.cargandoStats = false;

          this.registrarError(
            'No se pudieron cargar los entrenamientos.',
            error
          );
        }
      });
  }

  /**
   * Cuenta las recetas marcadas como favoritas
   * por el usuario.
   */
  private cargarRecetasFavoritas(): void {
    this.firestoreService
      .getByField<RecetaPerfil>(
        'recetas',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: recetas => {
          this.recetasFavoritas = recetas.filter(
            receta => receta.favorita === true
          ).length;
        },
        error: error => {
          this.registrarError(
            'No se pudieron cargar las recetas favoritas.',
            error
          );
        }
      });
  }

  /**
   * Cuenta los libros leídos y desbloquea
   * el logro correspondiente.
   */
  private cargarLibrosLeidos(): void {
    this.firestoreService
      .getByField<LibroPerfil>(
        'libros',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: libros => {
          const librosLeidos = libros.filter(
            libro => libro.estadoLectura === 'leido'
          ).length;

          this.actualizarLogro(
            3,
            librosLeidos >= 5
          );
        },
        error: error => {
          this.registrarError(
            'No se pudieron cargar los libros.',
            error
          );
        }
      });
  }


  // ========================================================
  // ÁNIMOS DEL MES
  // ========================================================

  /**
   * Recupera los registros de ánimo del mes actual,
   * calcula el promedio y obtiene la racha consecutiva.
   */
  cargarAnimosMes(): void {
    if (!this.usuarioId) {
      return;
    }

    this.cargandoAnimos = true;

    this.firestoreService
      .getByField<AnimoPerfil>(
        'animos',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: animos => {
          const inicioMes =
            this.obtenerInicioMesActual();

          this.animosMes = animos
            .map(animo => this.normalizarAnimo(animo))
            .filter(
              (animo): animo is AnimoNormalizado =>
                animo !== null &&
                animo.fecha >= inicioMes
            )
            .sort(
              (a, b) =>
                a.fecha.localeCompare(b.fecha)
            );

          this.actualizarResumenAnimos();
          this.actualizarRacha(animos);

          this.cargandoAnimos = false;
        },
        error: error => {
          this.cargandoAnimos = false;

          this.registrarError(
            'No se pudieron cargar los registros de ánimo.',
            error
          );
        }
      });
  }

  /**
   * Calcula la cantidad de registros, el promedio
   * y el emoji representativo del mes.
   */
  private actualizarResumenAnimos(): void {
    this.diasRegistrados = this.animosMes.length;

    if (this.diasRegistrados === 0) {
      this.promedioAnimo = 0;
      this.emojiPromedio = '🙂';

      return;
    }

    const sumaTotal = this.animosMes.reduce(
      (total, animo) => total + animo.valor,
      0
    );

    this.promedioAnimo =
      Math.round(
        (sumaTotal / this.diasRegistrados) * 10
      ) / 10;

    this.emojiPromedio = this.getEmojiPorValor(
      Math.round(this.promedioAnimo)
    );
  }

  /**
   * Calcula cuántos días consecutivos registró
   * el usuario hasta hoy o ayer.
   */
  private actualizarRacha(
    animos: AnimoPerfil[]
  ): void {
    const fechas = animos
      .map(animo =>
        this.convertirFechaAFormatoLocal(animo.fecha)
      )
      .filter(
        (fecha): fecha is string =>
          Boolean(fecha)
      );

    this.diasSeguidos =
      this.calcularDiasConsecutivos(fechas);

    this.actualizarLogro(
      0,
      this.diasSeguidos >= 7
    );

    /*
     * Por el momento se interpreta "Constancia"
     * como haber registrado actividad durante 3 días.
     */
    this.actualizarLogro(
      4,
      this.diasSeguidos >= 3
    );
  }


  // ========================================================
  // HELPERS PARA LA VISTA
  // ========================================================

  /**
   * Devuelve un emoji según un valor entre 1 y 5.
   */
  getEmojiPorValor(valor: number): string {
    const emojis: Record<number, string> = {
      1: '😢',
      2: '😐',
      3: '🙂',
      4: '😊',
      5: '🤩'
    };

    return emojis[valor] ?? '🙂';
  }

  /**
   * Devuelve una descripción textual del ánimo.
   */
  getLabelPorValor(valor: number): string {
  const labels: Record<number, string> = {
    1: 'Mal',
    2: 'Regular',
    3: 'Bien',
    4: 'Muy bien',
    5: 'Excelente'
  };

  const valorRedondeado = Math.min(
    5,
    Math.max(1, Math.round(valor))
  );

  return labels[valorRedondeado] ?? 'Bien';
}

  /**
   * Devuelve el color correspondiente al valor del ánimo.
   */
  getColorAnimo(valor: number): string {
    const colores: Record<number, string> = {
      1: '#EF4444',
      2: '#F59E0B',
      3: '#4A9EFF',
      4: '#34D399',
      5: '#8B5CF6'
    };

    return colores[valor] ?? '#4A9EFF';
  }

  /**
   * Iniciales utilizadas cuando el usuario
   * no tiene una imagen de perfil.
   */
  get iniciales(): string {
    const inicialNombre =
      this.nombre.trim().charAt(0);

    const inicialApellido =
      this.apellido.trim().charAt(0);

    const iniciales =
      `${inicialNombre}${inicialApellido}`
        .toUpperCase();

    return iniciales || 'U';
  }

  /**
   * Nombre completo mostrado en la vista.
   */
  get nombreCompleto(): string {
    const nombreCompleto =
      `${this.nombre} ${this.apellido}`.trim();

    return nombreCompleto || 'Usuario';
  }

  /**
   * Cierra la sesión actual.
   */
  logout(): void {
    void this.authService.logout();
  }


  // ========================================================
  // MÉTODOS PRIVADOS GENERALES
  // ========================================================

  /**
   * Copia al componente la información
   * del usuario autenticado.
   */
  private cargarDatosUsuario(
    usuario: UsuarioPerfil
  ): void {
    this.usuarioId = usuario.id;
    this.nombre = usuario.nombre?.trim() ?? '';
    this.apellido = usuario.apellido?.trim() ?? '';
    this.email = usuario.email?.trim() ?? '';
    this.esAdmin = usuario.rol === 'admin';
  }

  /**
   * Elige una frase según el día del año.
   *
   * Así la frase cambia diariamente y no solamente
   * según el día de la semana.
   */
  private seleccionarFraseDelDia(): void {
    const hoy = new Date();

    const inicioAnio =
      new Date(hoy.getFullYear(), 0, 0);

    const milisegundosTranscurridos =
      hoy.getTime() - inicioAnio.getTime();

    const diaDelAnio = Math.floor(
      milisegundosTranscurridos /
      (1000 * 60 * 60 * 24)
    );

    const posicion =
      diaDelAnio % this.frases.length;

    this.fraseDelDia =
      this.frases[posicion] ?? this.frases[0];
  }

  /**
   * Actualiza un logro de forma segura,
   * comprobando primero que exista.
   */
  private actualizarLogro(
    indice: number,
    desbloqueado: boolean
  ): void {
    const logro = this.logros[indice];

    if (logro) {
      logro.desbloqueado = desbloqueado;
    }
  }

  /**
   * Convierte un registro de ánimo a un formato
   * uniforme y seguro.
   */
  private normalizarAnimo(
    animo: AnimoPerfil
  ): AnimoNormalizado | null {
    const fecha =
      this.convertirFechaAFormatoLocal(animo.fecha);

    const valor =
      this.convertirANumero(animo.valor);

    if (
      !fecha ||
      valor < 1 ||
      valor > 5
    ) {
      return null;
    }

    return {
      fecha,
      valor
    };
  }

  /**
   * Retorna el primer día del mes actual
   * con formato YYYY-MM-DD.
   */
  private obtenerInicioMesActual(): string {
    const ahora = new Date();

    const inicioMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      1
    );

    return this.formatearFechaLocal(inicioMes);
  }

  /**
   * Retorna la fecha correspondiente a siete días atrás.
   */
  private obtenerFechaHaceSieteDias(): Date {
    const fecha = new Date();

    fecha.setHours(0, 0, 0, 0);
    fecha.setDate(fecha.getDate() - 6);

    return fecha;
  }

  /**
   * Calcula la cantidad de fechas consecutivas.
   *
   * La racha puede comenzar hoy o ayer, para no perderse
   * apenas inicia un nuevo día sin actividad registrada.
   */
  private calcularDiasConsecutivos(
    fechasRecibidas: string[]
  ): number {
    const fechasUnicas =
      new Set(fechasRecibidas);

    if (fechasUnicas.size === 0) {
      return 0;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let fechaEvaluada = new Date(hoy);

    const fechaHoy =
      this.formatearFechaLocal(fechaEvaluada);

    /*
     * Cuando todavía no existe un registro de hoy,
     * se permite comenzar el cálculo desde ayer.
     */
    if (!fechasUnicas.has(fechaHoy)) {
      fechaEvaluada.setDate(
        fechaEvaluada.getDate() - 1
      );
    }

    let diasConsecutivos = 0;

    while (
      fechasUnicas.has(
        this.formatearFechaLocal(fechaEvaluada)
      )
    ) {
      diasConsecutivos++;

      fechaEvaluada.setDate(
        fechaEvaluada.getDate() - 1
      );
    }

    return diasConsecutivos;
  }

  /**
   * Convierte distintos formatos de fecha:
   * string, Date o Timestamp de Firebase.
   */
  private convertirAFecha(
    valor: unknown
  ): Date | null {
    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime())
        ? null
        : valor;
    }

    if (typeof valor === 'string') {
      const fecha = new Date(valor);

      return Number.isNaN(fecha.getTime())
        ? null
        : fecha;
    }

    if (
      typeof valor === 'object' &&
      valor !== null &&
      'toDate' in valor &&
      typeof (
        valor as { toDate?: unknown }
      ).toDate === 'function'
    ) {
      const fecha = (
        valor as { toDate: () => Date }
      ).toDate();

      return Number.isNaN(fecha.getTime())
        ? null
        : fecha;
    }

    return null;
  }

  /**
   * Convierte cualquier formato de fecha válido
   * a YYYY-MM-DD según la zona horaria local.
   */
  private convertirFechaAFormatoLocal(
    valor: unknown
  ): string | null {
    if (
      typeof valor === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
      return valor;
    }

    const fecha = this.convertirAFecha(valor);

    return fecha
      ? this.formatearFechaLocal(fecha)
      : null;
  }

  /**
   * Formatea una fecha sin utilizar toISOString().
   *
   * Se evita toISOString porque trabaja en UTC y puede
   * modificar el día según la zona horaria del usuario.
   */
  private formatearFechaLocal(
    fecha: Date
  ): string {
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
   * Convierte números o textos numéricos a number.
   */
  private convertirANumero(
    valor: unknown
  ): number {
    const numero = Number(valor);

    return Number.isFinite(numero)
      ? numero
      : 0;
  }

  /**
   * Centraliza los errores de carga.
   */
  private registrarError(
    mensaje: string,
    error: unknown
  ): void {
    console.error(mensaje, error);

    this.mensajeError =
      'Algunos datos del perfil no pudieron cargarse. ' +
      'Intentá nuevamente más tarde.';
  }
}