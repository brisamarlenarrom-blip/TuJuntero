// Servicio de autenticación con Firebase Firestore
import { Injectable, signal } from '@angular/core';
import { FirestoreService } from './firestore.service';   // Nuestro servicio de Firestore
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

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

  constructor(private fs: FirestoreService) {
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

  // Login: busca el usuario en Firestore por email y contraseña
  login(email: string, password: string): Observable<boolean> {
    return this.fs.getByField('usuarios', 'email', email).pipe(
      map((usuarios: Usuario[]) => {
        const user = usuarios.find(u => u.password === password);
        if (user) {
          this.usuarioActual.set(user);
          this.isLogged.set(true);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('usuarioActual', JSON.stringify(user));
          }
          return true;
        }
        return false;
      })
    );
  }

  // Registro: crea un usuario nuevo en Firestore
  register(usuario: Partial<Usuario>): Observable<any> {
    const nuevoUsuario = {
      ...usuario,
      rol: 'usuario',
      esMentor: false,
      avatarUrl: usuario.avatarUrl || 'assets/default-avatar.png',
      trabaja: usuario.trabaja || false,
      haceDeporte: usuario.haceDeporte || false
    };
    return from(this.fs.createWithId('usuarios', usuario.email || 'sin-email', nuevoUsuario));
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