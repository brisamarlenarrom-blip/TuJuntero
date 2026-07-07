import { Injectable, signal } from '@angular/core';
import { FirestoreService } from './firestore.service';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  fechaNacimiento: string;
  avatarUrl: string;
  nivelEstudios: string;
  carreraOInteres?: string;
  trabaja: boolean;
  horasTrabajoPorDia?: number;
  haceDeporte: boolean;
  queDeporte?: string;
  frecuenciaDeporte?: string;
  rol: 'usuario' | 'mentor' | 'admin';
  esMentor: boolean;
  bio?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private usuarioActual = signal<Usuario | null>(null);
  private isLogged = signal<boolean>(false);

  private authReadyResolver!: () => void;

  authReadyPromise = new Promise<void>((resolve) => {
    this.authReadyResolver = resolve;
  });

  constructor(
    private fs: FirestoreService,
    private auth: Auth
  ) {
    this.inicializarSesion();
  }

  private inicializarSesion(): void {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      try {
        if (!firebaseUser?.email) {
          this.limpiarSesionLocal();
          return;
        }

        await this.cargarUsuarioPorEmail(firebaseUser.email);

      } catch (error) {
        console.error('Error recuperando sesión:', error);
        this.limpiarSesionLocal();

      } finally {
        this.authReadyResolver();
      }
    });
  }

  getUsuarioActual(): Usuario | null {
    return this.usuarioActual();
  }

  getIsLogged(): boolean {
    return this.isLogged();
  }

  getRol(): string {
    return this.usuarioActual()?.rol || 'usuario';
  }

  async refrescarUsuarioActual(): Promise<Usuario | null> {
    const email = this.auth.currentUser?.email;

    if (!email) {
      return this.usuarioActual();
    }

    return await this.cargarUsuarioPorEmail(email);
  }

  private async cargarUsuarioPorEmail(email: string): Promise<Usuario | null> {
    const usuarios = await firstValueFrom(
      this.fs.getByField('usuarios', 'email', email)
    );

    if (usuarios.length === 0) {
      this.limpiarSesionLocal();
      return null;
    }

    const usuario = usuarios[0] as Usuario;
    this.setSesion(usuario);
    return usuario;
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      const usuario = await this.cargarUsuarioPorEmail(email);
      return !!usuario;

    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    }
  }

  async loginWithGoogle(): Promise<boolean> {
    try {
      const provider = new GoogleAuthProvider();
      const credencial = await signInWithPopup(this.auth, provider);

      const email = credencial.user.email || '';
      const uid = credencial.user.uid;

      const usuarios = await firstValueFrom(
        this.fs.getByField('usuarios', 'email', email)
      );

      if (usuarios.length > 0) {
        this.setSesion(usuarios[0] as Usuario);
        return true;
      }

      const nuevoUsuario: Usuario = {
        id: uid,
        nombre: credencial.user.displayName?.split(' ')[0] || '',
        apellido: credencial.user.displayName?.split(' ').slice(1).join(' ') || '',
        email,
        password: '',
        fechaNacimiento: '',
        avatarUrl: credencial.user.photoURL || 'assets/default-avatar.png',
        nivelEstudios: '',
        carreraOInteres: '',
        trabaja: false,
        haceDeporte: false,
        rol: 'usuario',
        esMentor: false,
        bio: ''
      };

      await this.fs.createWithId('usuarios', uid, nuevoUsuario);
      this.setSesion(nuevoUsuario);

      return true;

    } catch (error) {
      console.error('Error con Google:', error);
      return false;
    }
  }

  async register(usuario: Partial<Usuario>): Promise<Usuario> {
    const credencial = await createUserWithEmailAndPassword(
      this.auth,
      usuario.email || '',
      usuario.password || ''
    );

    const uid = credencial.user.uid;

    const nuevoUsuario: Usuario = {
      id: uid,
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      password: usuario.password || '',
      fechaNacimiento: usuario.fechaNacimiento || '',
      avatarUrl: 'assets/default-avatar.png',
      nivelEstudios: '',
      carreraOInteres: '',
      trabaja: false,
      haceDeporte: false,
      rol: 'usuario',
      esMentor: false,
      bio: ''
    };

    await this.fs.createWithId('usuarios', uid, nuevoUsuario);
    this.setSesion(nuevoUsuario);

    return nuevoUsuario;
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async actualizarUsuario(datos: Partial<Usuario>): Promise<void> {
    const usuario = this.usuarioActual();
    if (!usuario) throw new Error('No hay usuario logueado');

    await this.fs.update('usuarios', usuario.id, datos);

    const actualizado = { ...usuario, ...datos };
    this.setSesion(actualizado);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.limpiarSesionLocal();
  }

  private setSesion(usuario: Usuario): void {
    this.usuarioActual.set(usuario);
    this.isLogged.set(true);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('usuarioActual', JSON.stringify(usuario));
    }
  }

  private limpiarSesionLocal(): void {
    this.usuarioActual.set(null);
    this.isLogged.set(false);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('usuarioActual');
    }
  }
}