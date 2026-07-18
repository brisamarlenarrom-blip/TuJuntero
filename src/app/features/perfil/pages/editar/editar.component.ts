import {
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  AuthService,
  Usuario
} from '../../../../core/auth.service';


@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.css'
})
export class EditarPerfilComponent implements OnInit, OnDestroy {

  /* =====================================================
     SERVICIOS
     ===================================================== */

  /*
   * inject() permite obtener los servicios sin utilizar
   * un constructor tradicional.
   */
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);


  /* =====================================================
     DATOS DEL FORMULARIO
     ===================================================== */

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


  /* =====================================================
     ESTADO DE LA PANTALLA
     ===================================================== */

  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  iniciales = 'U';

  /*
   * Se utiliza para impedir que se seleccione una fecha
   * de nacimiento posterior al día actual.
   */
  readonly fechaMaxima = this.obtenerFechaActual();


  /* =====================================================
     OPCIONES DE LOS SELECTORES
     ===================================================== */

  readonly nivelesEstudio: readonly string[] = [
    'Secundario incompleto',
    'Secundario completo',
    'Terciario/Universitario en curso',
    'Terciario completo',
    'Universitario completo',
    'Posgrado'
  ];

  readonly frecuenciasDeporte: readonly string[] = [
    '1-2 veces por semana',
    '3-4 veces por semana',
    '5 o más veces por semana',
    'Todos los días'
  ];


  /* =====================================================
     TEMPORIZADOR
     ===================================================== */

  /*
   * Guarda la referencia del temporizador utilizado para
   * volver al perfil después de una actualización exitosa.
   */
  private temporizadorNavegacion:
    ReturnType<typeof setTimeout> | null = null;


  /* =====================================================
     CICLO DE VIDA
     ===================================================== */

  ngOnInit(): void {
    this.cargarUsuario();
  }

  ngOnDestroy(): void {
    /*
     * Evita que el temporizador continúe activo si el
     * componente se destruye antes de navegar.
     */
    if (this.temporizadorNavegacion) {
      clearTimeout(this.temporizadorNavegacion);
    }
  }


  /* =====================================================
     ACCIONES PÚBLICAS
     ===================================================== */

  /**
   * Guarda los cambios realizados en el perfil.
   */
  async guardar(): Promise<void> {
    /*
     * Evita que se envíe el formulario varias veces
     * mientras todavía se está procesando.
     */
    if (this.guardando) {
      return;
    }

    this.limpiarMensajes();

    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;

    try {
      const datosActualizados =
        this.construirDatosActualizados();

      await this.auth.actualizarUsuario(
        datosActualizados
      );

      this.mensajeExito =
        '¡Perfil actualizado con éxito! 🎉';

      /*
       * Esperamos un momento para que el usuario pueda
       * visualizar el mensaje de confirmación.
       */
      this.temporizadorNavegacion = setTimeout(() => {
        void this.router.navigate(['/perfil']);
      }, 1500);

    } catch (error: unknown) {
      console.error(
        'Error al actualizar el perfil:',
        error
      );

      this.mensajeError =
        'Hubo un error al guardar los cambios. Intentá nuevamente.';

    } finally {
      this.guardando = false;
    }
  }


  /**
   * Regresa al dashboard del perfil sin guardar cambios.
   */
  volver(): void {
    void this.router.navigate(['/perfil']);
  }


  /**
   * Actualiza las letras que aparecen en el avatar.
   *
   * Este método puede ejecutarse desde el HTML cuando
   * cambia el nombre o el apellido.
   */
  actualizarIniciales(): void {
    const inicialNombre =
      this.nombre.trim().charAt(0);

    const inicialApellido =
      this.apellido.trim().charAt(0);

    const resultado =
      `${inicialNombre}${inicialApellido}`
        .toUpperCase();

    this.iniciales = resultado || 'U';
  }


  /**
   * Limpia los datos laborales cuando el usuario indica
   * que actualmente no trabaja.
   */
  alCambiarSituacionLaboral(): void {
    if (!this.trabaja) {
      this.horasTrabajoPorDia = 0;
    }
  }


  /**
   * Limpia los datos deportivos cuando el usuario indica
   * que actualmente no realiza deporte.
   */
  alCambiarActividadDeportiva(): void {
    if (!this.haceDeporte) {
      this.queDeporte = '';
      this.frecuenciaDeporte = '';
    }
  }


  /* =====================================================
     CARGA DE DATOS
     ===================================================== */

  /**
   * Obtiene el usuario autenticado y completa el formulario.
   */
  private cargarUsuario(): void {
    const usuario = this.auth.getUsuarioActual();

    if (!usuario) {
      /*
       * Si no existe una sesión válida, no se puede editar
       * ningún perfil.
       */
      void this.router.navigate(['/perfil']);
      return;
    }

    this.completarFormulario(usuario);
    this.actualizarIniciales();
  }


  /**
   * Copia los datos del usuario dentro de los campos
   * editables del formulario.
   */
  private completarFormulario(
    usuario: Usuario
  ): void {
    this.nombre = usuario.nombre ?? '';
    this.apellido = usuario.apellido ?? '';
    this.fechaNacimiento =
      usuario.fechaNacimiento ?? '';

    this.bio = usuario.bio ?? '';

    this.nivelEstudios =
      usuario.nivelEstudios ?? '';

    this.carreraOInteres =
      usuario.carreraOInteres ?? '';

    this.trabaja = usuario.trabaja ?? false;

    this.horasTrabajoPorDia =
      usuario.horasTrabajoPorDia ?? 0;

    this.haceDeporte =
      usuario.haceDeporte ?? false;

    this.queDeporte =
      usuario.queDeporte ?? '';

    this.frecuenciaDeporte =
      usuario.frecuenciaDeporte ?? '';
  }


  /* =====================================================
     VALIDACIONES
     ===================================================== */

  /**
   * Comprueba que la información ingresada sea válida.
   */
  private validarFormulario(): boolean {
    const nombreLimpio = this.nombre.trim();
    const apellidoLimpio = this.apellido.trim();

    if (!nombreLimpio || !apellidoLimpio) {
      this.mensajeError =
        'El nombre y el apellido son obligatorios.';

      return false;
    }

    if (
      nombreLimpio.length < 2 ||
      apellidoLimpio.length < 2
    ) {
      this.mensajeError =
        'El nombre y el apellido deben tener al menos 2 caracteres.';

      return false;
    }

    if (this.fechaNacimiento) {
      const fechaIngresada =
        new Date(`${this.fechaNacimiento}T00:00:00`);

      const fechaActual = new Date();

      fechaActual.setHours(23, 59, 59, 999);

      if (
        Number.isNaN(fechaIngresada.getTime()) ||
        fechaIngresada > fechaActual
      ) {
        this.mensajeError =
          'La fecha de nacimiento no es válida.';

        return false;
      }
    }

    if (this.trabaja) {
      const horas =
        Number(this.horasTrabajoPorDia);

      if (
        !Number.isFinite(horas) ||
        horas < 0 ||
        horas > 24
      ) {
        this.mensajeError =
          'Las horas de trabajo deben estar entre 0 y 24.';

        return false;
      }
    }

    if (
      this.haceDeporte &&
      !this.queDeporte.trim()
    ) {
      this.mensajeError =
        'Indicá qué deporte realizás.';

      return false;
    }

    if (
      this.haceDeporte &&
      !this.frecuenciaDeporte
    ) {
      this.mensajeError =
        'Seleccioná con qué frecuencia realizás deporte.';

      return false;
    }

    return true;
  }


  /* =====================================================
     CONSTRUCCIÓN DE DATOS
     ===================================================== */

  /**
   * Construye únicamente la información que se enviará
   * al AuthService para actualizar el perfil.
   */
  private construirDatosActualizados():
    Partial<Usuario> {
    return {
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),

      fechaNacimiento:
        this.fechaNacimiento,

      bio: this.bio.trim(),

      nivelEstudios:
        this.nivelEstudios,

      carreraOInteres:
        this.carreraOInteres.trim(),

      trabaja: this.trabaja,

      horasTrabajoPorDia:
        this.trabaja
          ? this.normalizarHorasTrabajo()
          : 0,

      haceDeporte:
        this.haceDeporte,

      queDeporte:
        this.haceDeporte
          ? this.queDeporte.trim()
          : '',

      frecuenciaDeporte:
        this.haceDeporte
          ? this.frecuenciaDeporte
          : ''
    };
  }


  /**
   * Convierte las horas laborales a un número válido.
   */
  private normalizarHorasTrabajo(): number {
    const horas = Number(
      this.horasTrabajoPorDia
    );

    return Number.isFinite(horas)
      ? horas
      : 0;
  }


  /* =====================================================
     MÉTODOS AUXILIARES
     ===================================================== */

  /**
   * Limpia los mensajes anteriores antes de realizar
   * una nueva operación.
   */
  private limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }


  /**
   * Genera la fecha actual en formato YYYY-MM-DD,
   * compatible con los inputs HTML de tipo date.
   */
  private obtenerFechaActual(): string {
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
}