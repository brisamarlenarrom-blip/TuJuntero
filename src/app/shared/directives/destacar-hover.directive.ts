// Directiva personalizada: agrega un brillo sutil al pasar el mouse sobre un elemento
import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDestacarHover]',
  standalone: true
})
export class DestacarHoverDirective {

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.3s ease');
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'border-color', 'var(--blue-soft)');
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 0 16px rgba(96, 165, 250, 0.3)');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-2px)');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'border-color', 'var(--border-color)');
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', 'none');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0)');
  }
}