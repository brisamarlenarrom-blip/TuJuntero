// Pipe personalizado: convierte una fecha en texto relativo ("Ahora", "Hace 5 min", "Hace 2 h")
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tiempoRelativo',
  standalone: true
})
export class TiempoRelativoPipe implements PipeTransform {

  transform(fecha: string): string {
    if (!fecha) return '';

    const ahora = new Date();
    const entonces = new Date(fecha);
    const minutos = Math.floor((ahora.getTime() - entonces.getTime()) / 60000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (minutos < 1440) return `Hace ${Math.floor(minutos / 60)} h`;
    return `Hace ${Math.floor(minutos / 1440)} d`;
  }
}