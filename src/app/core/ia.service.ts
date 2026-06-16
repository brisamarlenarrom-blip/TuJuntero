import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class IaService {

  private apiUrl = 'http://localhost:3000/api/chat';

  constructor(private http: HttpClient) {}

  preguntar(prompt: string) {
    return this.http.post<any>(this.apiUrl, { prompt });
  }
}