import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private theme = signal<ThemeMode>('dark');

  getTheme() {
    return this.theme.asReadonly();
  }

  toggleTheme() {
    this.theme.update(current => current === 'dark' ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode) {
    this.theme.set(mode);
  }
}