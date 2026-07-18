// ==========================================================
// SERVICIO DE INTELIGENCIA ARTIFICIAL
// ==========================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';


/**
 * Posibles estructuras que puede devolver el backend.
 *
 * Dependiendo de cómo esté programado el servidor, la respuesta
 * podría venir como:
 *
 * { respuesta: 'texto' }
 * { texto: 'texto' }
 * { message: 'texto' }
 * { content: 'texto' }
 * { response: 'texto' }
 *
 * También podría devolver directamente un string.
 */
interface RespuestaBackendIa {
  respuesta?: string;
  texto?: string;
  text?: string;
  message?: string;
  content?: string;
  response?: string;

  data?: {
    respuesta?: string;
    texto?: string;
    text?: string;
    message?: string;
    content?: string;
    response?: string;
  };

  choices?: Array<{
    message?: {
      content?: string;
    };

    text?: string;
  }>;
}


@Injectable({
  providedIn: 'root'
})
export class IaService {

  // ========================================================
  // INYECCIÓN DE DEPENDENCIAS
  // ========================================================

  private readonly http = inject(HttpClient);


  // ========================================================
  // CONFIGURACIÓN DEL BACKEND
  // ========================================================

  /**
   * Dirección del servidor que se comunica con la IA.
   *
   * IMPORTANTE:
   * Esta URL funciona solamente cuando el backend está
   * ejecutándose localmente en el puerto 3000.
   */
  private readonly apiUrl = 'http://localhost:3000/api/chat';


  // ========================================================
  // CONSULTA A LA INTELIGENCIA ARTIFICIAL
  // ========================================================

  /**
   * Envía el prompt al backend y devuelve únicamente
   * el contenido textual de la respuesta.
   *
   * El componente no necesita conocer la estructura exacta
   * enviada por el servidor.
   */
  preguntar(prompt: string): Observable<string> {
    return this.http
      .post<RespuestaBackendIa | string>(
        this.apiUrl,
        { prompt }
      )
      .pipe(
        map((respuestaBackend) =>
          this.extraerTextoRespuesta(respuestaBackend)
        )
      );
  }


  // ========================================================
  // NORMALIZACIÓN DE LA RESPUESTA
  // ========================================================

  /**
   * Busca el texto generado dentro de las diferentes estructuras
   * que podría devolver el backend.
   */
  private extraerTextoRespuesta(
    respuestaBackend: RespuestaBackendIa | string
  ): string {

    // Si el servidor devuelve directamente un texto.
    if (typeof respuestaBackend === 'string') {
      return respuestaBackend.trim();
    }


    // Respuestas simples.
    const respuestaSimple =
      respuestaBackend.respuesta ??
      respuestaBackend.texto ??
      respuestaBackend.text ??
      respuestaBackend.message ??
      respuestaBackend.content ??
      respuestaBackend.response;

    if (
      typeof respuestaSimple === 'string' &&
      respuestaSimple.trim()
    ) {
      return respuestaSimple.trim();
    }


    // Respuestas guardadas dentro de la propiedad data.
    const respuestaData =
      respuestaBackend.data?.respuesta ??
      respuestaBackend.data?.texto ??
      respuestaBackend.data?.text ??
      respuestaBackend.data?.message ??
      respuestaBackend.data?.content ??
      respuestaBackend.data?.response;

    if (
      typeof respuestaData === 'string' &&
      respuestaData.trim()
    ) {
      return respuestaData.trim();
    }


    // Estructura frecuente utilizada por OpenAI y otros modelos.
    const respuestaChoice =
      respuestaBackend.choices?.[0]?.message?.content ??
      respuestaBackend.choices?.[0]?.text;

    if (
      typeof respuestaChoice === 'string' &&
      respuestaChoice.trim()
    ) {
      return respuestaChoice.trim();
    }


    /*
     * Si ninguna propiedad contiene texto, se devuelve
     * una cadena vacía para que el componente pueda detectar
     * correctamente el problema.
     */
    return '';
  }
}