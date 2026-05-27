// Importaciones necesarias para el servicio HTTP
import { Injectable } from '@angular/core';            // Decorador Injectable
import { HttpClient } from '@angular/common/http';      // Para hacer peticiones GET, POST, PUT, DELETE
import { Observable } from 'rxjs';                      // Para manejar respuestas asincrónicas

@Injectable({
  providedIn: 'root'  // El servicio está disponible en toda la app sin necesidad de importarlo en módulos
})
export class ApiService {
  
  // URL base de MockAPI (donde están guardados los datos)
  private baseUrl = 'https://6a0c66255aa893e1015bdd97.mockapi.io';

  // Inyecta HttpClient para poder hacer llamadas HTTP
  constructor(private http: HttpClient) {}

  // ============ USUARIOS ============

  // Obtiene todos los usuarios registrados
  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/usuarios`);
  }

  // Obtiene un usuario por su ID
  getUsuarioById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/usuarios/${id}`);
  }

  // Crea un nuevo usuario (registro)
  createUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/usuarios`, usuario);
  }

  // Actualiza los datos de un usuario existente
  updateUsuario(id: string, usuario: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/usuarios/${id}`, usuario);
  }

  // Elimina un usuario por su ID
  deleteUsuario(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/usuarios/${id}`);
  }

  // ============ RECETAS / ITEMS GENÉRICOS ============
  // El recurso "recetas" guarda todo tipo de datos (frases, tareas, rutinas, etc.)
  // Se diferencia cada tipo por el campo "tipo"

  // Obtiene items filtrados por tipo (ej: "frase", "tarea", "receta")
  getItemsByTipo(tipo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/recetas?tipo=${tipo}`);
  }

  // Obtiene un item por su ID
  getItemById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/recetas/${id}`);
  }

  // Crea un nuevo item (frase, tarea, receta, etc.)
  createItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/recetas`, item);
  }

  // Actualiza un item existente
  updateItem(id: string, item: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/recetas/${id}`, item);
  }

  // Elimina un item por su ID
  deleteItem(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/recetas/${id}`);
  }
}