import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IaService {

 const apiKey = environment.groqApiKey;

  constructor(private http: HttpClient) {}

  async preguntar(prompt: string): Promise<string> {
    try {

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      });

      const body = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      const respuesta: any = await firstValueFrom(
        this.http.post(
          'https://api.groq.com/openai/v1/chat/completions',
          body,
          { headers }
        )
      );

      return respuesta.choices[0].message.content;

    }catch (error: any) {
  console.error('ERROR COMPLETO:', error);

  return JSON.stringify(error);
}
  }
}