import { Injectable, signal } from '@angular/core';

import {
  Auth,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from '@angular/fire/auth';

import { firstValueFrom } from 'rxjs';

import { FirestoreService } from './firestore.service';

/* =====================================================
   TIPOS E INTERFACES
   ===================================================== */

/*
 * Solo se permiten estos tres roles dentro de la aplicación.
 */
export type RolUsuario = 'usuario' | 'mentor' | 'admin';

/*
 * Representa los datos personales del usuario guardados
 * en la colección "usuarios" de Firestore.
 *
 * IMPORTANTE:
 * La contraseña no se guarda en esta interfaz porque
 * Firebase Authentication la administra de forma segura.
 */
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  fechaNacimiento: string;
  avatarUrl: string;
  nivelEstudios: string;
  carreraOInteres?: string;
  trabaja: boolean;
  horasTrabajoPorDia?: number;
  haceDeporte: boolean;
  queDeporte?: string;
  frecuenciaDeporte?: string;
  rol: RolUsuario;
  esMentor: boolean;
  bio?: string;
}

/*
 * Datos que recibe el método register().
 *
 * La contraseña aparece solamente acá porque se necesita
 * para crear la cuenta en Firebase Authentication.
 * No se guarda en Firestore.
 */
export interface DatosRegistro {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  fechaNacimiento: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /* =====================================================
     ESTADO DE AUTENTICACIÓN
     ===================================================== */

  /*
   * Signal que almacena los datos del usuario actualmente
   * autenticado.
   */
  private usuarioActual = signal<Usuario | null>(null);

  /*
   * Signal que indica si existe una sesión iniciada.
   */
  private isLogged = signal<boolean>(false);

  /*
   * Permite esperar hasta que Firebase determine si existe
   * una sesión activa al iniciar la aplicación.
   */
  private authReadyResolver!: () => void;

  readonly authReadyPromise = new Promise<void>((resolve) => {
    this.authReadyResolver = resolve;
  });

  constructor(
    private fs: FirestoreService,
    private auth: Auth
  ) {
    this.inicializarSesion();
  }

  /* =====================================================
     INICIALIZACIÓN DE LA SESIÓN
     ===================================================== */

  private inicializarSesion(): void {
    /*
     * onAuthStateChanged escucha los cambios de autenticación.
     *
     * Se ejecuta cuando:
     * - inicia la aplicación;
     * - el usuario inicia sesión;
     * - el usuario cierra sesión;
     * - Firebase recupera una sesión anterior.
     */
    onAuthStateChanged(
      this.auth,

      async (firebaseUser) => {
        try {
          /*
           * Si Firebase no encuentra un usuario autenticado,
           * limpiamos el estado local.
           */
          if (!firebaseUser?.email) {
            this.limpiarSesionLocal();
            return;
          }

          /*
           * Firebase Authentication guarda la identidad.
           * Firestore guarda el perfil completo del usuario.
           */
          await this.cargarUsuarioPorEmail(firebaseUser.email);

        } catch (error: unknown) {
          console.error(
            'Error al recuperar la sesión:',
            error
          );

          this.limpiarSesionLocal();

        } finally {
          /*
           * Avisamos que Firebase ya terminó de comprobar
           * el estado inicial de autenticación.
           */
          this.authReadyResolver();
        }
      },

      (error: unknown) => {
        /*
         * Este callback se ejecuta si el observador de
         * autenticación falla.
         */
        console.error(
          'Error al observar la autenticación:',
          error
        );

        this.limpiarSesionLocal();
        this.authReadyResolver();
      }
    );
  }

  /* =====================================================
     CONSULTA DEL ESTADO ACTUAL
     ===================================================== */

  getUsuarioActual(): Usuario | null {
    return this.usuarioActual();
  }

  getIsLogged(): boolean {
    return this.isLogged();
  }

  getRol(): RolUsuario {
    return this.usuarioActual()?.rol ?? 'usuario';
  }

  /*
   * Consulta nuevamente Firestore para recuperar cambios
   * realizados sobre el perfil o el rol del usuario.
   */
  async refrescarUsuarioActual(): Promise<Usuario | null> {
    const email = this.auth.currentUser?.email;

    if (!email) {
      return this.usuarioActual();
    }

    return this.cargarUsuarioPorEmail(email);
  }

  /* =====================================================
     BÚSQUEDA DEL USUARIO EN FIRESTORE
     ===================================================== */

  private async cargarUsuarioPorEmail(
    email: string
  ): Promise<Usuario | null> {
    const emailLimpio = email.trim();

    let usuarios = await firstValueFrom(
      this.fs.getByField(
        'usuarios',
        'email',
        emailLimpio
      )
    );

    /*
     * Firestore distingue mayúsculas y minúsculas.
     * Si no encontramos el email original, intentamos
     * nuevamente con el email en minúsculas.
     */
    const emailEnMinusculas = emailLimpio.toLowerCase();

    if (
      usuarios.length === 0 &&
      emailLimpio !== emailEnMinusculas
    ) {
      usuarios = await firstValueFrom(
        this.fs.getByField(
          'usuarios',
          'email',
          emailEnMinusculas
        )
      );
    }

    if (usuarios.length === 0) {
      this.limpiarSesionLocal();
      return null;
    }

    /*
     * Normalizamos los datos para guardar solamente
     * las propiedades permitidas de Usuario.
     */
    const usuario = this.normalizarUsuario(
      usuarios[0] as Partial<Usuario>
    );

    this.establecerSesion(usuario);

    return usuario;
  }

  /* =====================================================
     LOGIN CON EMAIL Y CONTRASEÑA
     ===================================================== */

  async login(
    email: string,
    password: string
  ): Promise<boolean> {
    const emailLimpio = email.trim();

    try {
      /*
       * Firebase comprueba el email y la contraseña.
       */
      const credencial = await signInWithEmailAndPassword(
        this.auth,
        emailLimpio,
        password
      );

      /*
       * Después del login buscamos el perfil completo
       * del usuario en Firestore.
       */
      const emailFirebase =
        credencial.user.email ?? emailLimpio;

      const usuario = await this.cargarUsuarioPorEmail(
        emailFirebase
      );

      return usuario !== null;

    } catch (error: unknown) {
      console.error(
        'Error al iniciar sesión:',
        error
      );

      this.limpiarSesionLocal();

      return false;
    }
  }

  /* =====================================================
     LOGIN CON GOOGLE
     ===================================================== */

  async loginWithGoogle(): Promise<boolean> {
    try {
      /*
       * Creamos el proveedor de autenticación de Google.
       */
      const provider = new GoogleAuthProvider();

      /*
       * Abre una ventana emergente para seleccionar
       * una cuenta de Google.
       */
      const credencial = await signInWithPopup(
        this.auth,
        provider
      );

      const email = (
        credencial.user.email ?? ''
      )
        .trim()
        .toLowerCase();

      const uid = credencial.user.uid;

      if (!email) {
        throw new Error(
          'Google no proporcionó un email válido.'
        );
      }

      /*
       * Buscamos si el usuario ya tiene un perfil
       * guardado en Firestore.
       */
      const usuarios = await firstValueFrom(
        this.fs.getByField(
          'usuarios',
          'email',
          email
        )
      );

      /*
       * Si ya existe, mantenemos sus datos y su rol.
       */
      if (usuarios.length > 0) {
        const usuarioExistente =
          this.normalizarUsuario(
            usuarios[0] as Partial<Usuario>
          );

        this.establecerSesion(usuarioExistente);

        return true;
      }

      /*
       * Si es la primera vez que ingresa con Google,
       * creamos su perfil en Firestore.
       */
      const datosNombre = this.separarNombreCompleto(
        credencial.user.displayName
      );

      const nuevoUsuario: Usuario = {
        id: uid,
        nombre: datosNombre.nombre,
        apellido: datosNombre.apellido,
        email,
        fechaNacimiento: '',
        avatarUrl:
          credencial.user.photoURL ??
          'assets/default-avatar.png',
        nivelEstudios: '',
        carreraOInteres: '',
        trabaja: false,
        haceDeporte: false,
        rol: 'usuario',
        esMentor: false,
        bio: ''
      };

      await this.fs.createWithId(
        'usuarios',
        uid,
        nuevoUsuario
      );

      this.establecerSesion(nuevoUsuario);

      return true;

    } catch (error: unknown) {
      console.error(
        'Error al iniciar sesión con Google:',
        error
      );

      /*
       * Si falla la creación o recuperación del perfil,
       * cerramos cualquier sesión incompleta.
       */
      try {
        await signOut(this.auth);
      } catch (errorLogout: unknown) {
        console.error(
          'No se pudo cerrar la sesión incompleta:',
          errorLogout
        );
      }

      this.limpiarSesionLocal();

      return false;
    }
  }

  /* =====================================================
     REGISTRO CON EMAIL Y CONTRASEÑA
     ===================================================== */

  async register(
    datos: DatosRegistro
  ): Promise<Usuario> {
    const email = datos.email
      .trim()
      .toLowerCase();

    /*
     * Firebase crea la cuenta y administra la contraseña.
     */
    const credencial =
      await createUserWithEmailAndPassword(
        this.auth,
        email,
        datos.password
      );

    const uid = credencial.user.uid;

    const nuevoUsuario: Usuario = {
      id: uid,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email,
      fechaNacimiento: datos.fechaNacimiento,
      avatarUrl: 'assets/default-avatar.png',
      nivelEstudios: '',
      carreraOInteres: '',
      trabaja: false,
      haceDeporte: false,
      rol: 'usuario',
      esMentor: false,
      bio: ''
    };

    try {
      /*
       * Guardamos el perfil en Firestore utilizando
       * el mismo UID generado por Firebase Authentication.
       */
      await this.fs.createWithId(
        'usuarios',
        uid,
        nuevoUsuario
      );

      this.establecerSesion(nuevoUsuario);

      return nuevoUsuario;

    } catch (error: unknown) {
      console.error(
        'Firebase creó la cuenta, pero no se pudo guardar el perfil:',
        error
      );

      /*
       * Si falla Firestore, eliminamos la cuenta recién creada
       * para evitar que quede un usuario sin perfil.
       */
      await this.eliminarCuentaIncompleta(
        credencial.user
      );

      throw error;
    }
  }

  /* =====================================================
     RECUPERACIÓN DE CONTRASEÑA
     ===================================================== */

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(
      this.auth,
      email.trim().toLowerCase()
    );
  }

  /* =====================================================
     ACTUALIZACIÓN DEL USUARIO
     ===================================================== */

  async actualizarUsuario(
    datos: Partial<Usuario>
  ): Promise<void> {
    const usuario = this.usuarioActual();

    if (!usuario) {
      throw new Error(
        'No hay un usuario autenticado.'
      );
    }

    /*
     * El identificador del usuario no debe modificarse.
     */
    const {
      id: _idIgnorado,
      ...datosActualizables
    } = datos;

    await this.fs.update(
      'usuarios',
      usuario.id,
      datosActualizables
    );

    const usuarioActualizado =
      this.normalizarUsuario({
        ...usuario,
        ...datosActualizables,
        id: usuario.id
      });

    this.establecerSesion(usuarioActualizado);
  }

  /* =====================================================
     CIERRE DE SESIÓN
     ===================================================== */

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);

    } finally {
      /*
       * Limpiamos el estado local incluso si Firebase
       * devuelve un error al cerrar sesión.
       */
      this.limpiarSesionLocal();
    }
  }

  /* =====================================================
     MÉTODOS AUXILIARES DE SESIÓN
     ===================================================== */

  private establecerSesion(usuario: Usuario): void {
    /*
     * Volvemos a normalizar el objeto para evitar guardar
     * propiedades antiguas o no permitidas.
     *
     * Esto también elimina una posible propiedad password
     * que pudiera existir en documentos anteriores.
     */
    const usuarioSeguro =
      this.normalizarUsuario(usuario);

    this.usuarioActual.set(usuarioSeguro);
    this.isLogged.set(true);

    /*
     * Firebase ya conserva la autenticación.
     *
     * localStorage se utiliza solamente para conservar
     * una copia local del perfil, nunca la contraseña.
     */
    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      localStorage.setItem(
        'usuarioActual',
        JSON.stringify(usuarioSeguro)
      );
    }
  }

  private limpiarSesionLocal(): void {
    this.usuarioActual.set(null);
    this.isLogged.set(false);

    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      localStorage.removeItem('usuarioActual');
    }
  }

  /* =====================================================
     NORMALIZACIÓN DE DATOS
     ===================================================== */

  private normalizarUsuario(
    datos: Partial<Usuario>
  ): Usuario {
    return {
      id: datos.id ?? '',
      nombre: datos.nombre ?? '',
      apellido: datos.apellido ?? '',
      email: datos.email?.trim().toLowerCase() ?? '',
      fechaNacimiento: datos.fechaNacimiento ?? '',
      avatarUrl:
        datos.avatarUrl ??
        'assets/default-avatar.png',
      nivelEstudios: datos.nivelEstudios ?? '',
      carreraOInteres: datos.carreraOInteres ?? '',
      trabaja: datos.trabaja ?? false,
      horasTrabajoPorDia: datos.horasTrabajoPorDia,
      haceDeporte: datos.haceDeporte ?? false,
      queDeporte: datos.queDeporte,
      frecuenciaDeporte: datos.frecuenciaDeporte,
      rol: datos.rol ?? 'usuario',
      esMentor: datos.esMentor ?? false,
      bio: datos.bio ?? ''
    };
  }

  private separarNombreCompleto(
    displayName: string | null
  ): {
    nombre: string;
    apellido: string;
  } {
    const partes = (displayName ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return {
      nombre: partes[0] ?? '',
      apellido: partes.slice(1).join(' ')
    };
  }

  private async eliminarCuentaIncompleta(
    firebaseUser: User
  ): Promise<void> {
    try {
      await deleteUser(firebaseUser);

    } catch (error: unknown) {
      console.error(
        'No se pudo eliminar la cuenta incompleta:',
        error
      );

      /*
       * Aunque la eliminación falle, cerramos la sesión.
       */
      await signOut(this.auth);
    } finally {
      this.limpiarSesionLocal();
    }
  }
}