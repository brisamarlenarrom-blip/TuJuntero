// Servicio de autenticación con Firebase Auth + Firestore
import { Injectable, signal } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';

// Interfaz que define los campos de un Usuario
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
  rol: string;
  esMentor: boolean;
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private usuarioActual = signal<Usuario | null>(null);
  private isLogged = signal<boolean>(false);

  constructor(
    private fs: FirestoreService,
    private auth: Auth
  ) {
    // Verificar si hay sesión guardada al iniciar
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUser = localStorage.getItem('usuarioActual');
      if (savedUser) {
        this.usuarioActual.set(JSON.parse(savedUser));
        this.isLogged.set(true);
      }
    }
  }

  getUsuarioActual(): Usuario | null {
    return this.usuarioActual();
  }

  getIsLogged(): boolean {
    return this.isLogged();
  }

  // Login con email y contraseña
  async login(email: string, password: string): Promise<boolean> {
    try {
      const credencial = await signInWithEmailAndPassword(this.auth, email, password);
      this.fs.getById('usuarios', credencial.user.uid).subscribe(usuario => {
        if (usuario) {
          this.usuarioActual.set(usuario as Usuario);
          this.isLogged.set(true);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('usuarioActual', JSON.stringify(usuario));
          }
        }
      });
      return true;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    }
  }

  // Login con Google
  async loginWithGoogle(): Promise<boolean> {
    try {
      const provider = new GoogleAuthProvider();
      const credencial = await signInWithPopup(this.auth, provider);
      
      const usuarioData: Partial<Usuario> = {
        nombre: credencial.user.displayName?.split(' ')[0] || '',
        apellido: credencial.user.displayName?.split(' ').slice(1).join(' ') || '',
        email: credencial.user.email || '',
        avatarUrl: credencial.user.photoURL || '',
        rol: 'usuario',
        esMentor: false
      };

      // Verifica si ya existe en Firestore, si no, lo crea
      this.fs.getById('usuarios', credencial.user.uid).subscribe(usuario => {
        if (!usuario) {
          this.fs.createWithId('usuarios', credencial.user.uid, usuarioData);
        }
        const datosFinales = { id: credencial.user.uid, ...usuarioData } as Usuario;
        this.usuarioActual.set(datosFinales);
        this.isLogged.set(true);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('usuarioActual', JSON.stringify(datosFinales));
        }
      });

      return true;
    } catch (error) {
      console.error('Error con Google:', error);
      return false;
    }
  }

  // Registro con email y contraseña
  async register(usuario: Partial<Usuario>): Promise<any> {
    const credencial = await createUserWithEmailAndPassword(
      this.auth,
      usuario.email || '',
      usuario.password || ''
    );

    const nuevoUsuario = {
      ...usuario,
      uid: credencial.user.uid,
      rol: 'usuario',
      esMentor: false,
      avatarUrl: usuario.avatarUrl || 'assets/default-avatar.png',
      trabaja: usuario.trabaja || false,
      haceDeporte: usuario.haceDeporte || false
    };

    return this.fs.createWithId('usuarios', credencial.user.uid, nuevoUsuario);
  }
  
  // Recuperación de contraseña: envía un mail
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  // Actualiza los datos del usuario logueado
  actualizarUsuario(datos: Partial<Usuario>): Promise<void> {
    const usuario = this.usuarioActual();
    if (!usuario) return Promise.reject('No hay usuario');
    
    return this.fs.update('usuarios', usuario.id, datos).then(() => {
      const actualizado = { ...usuario, ...datos };
      this.usuarioActual.set(actualizado);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('usuarioActual', JSON.stringify(actualizado));
      }
    });
  }

  logout(): void {
    this.usuarioActual.set(null);
    this.isLogged.set(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('usuarioActual');
    }
  }
}