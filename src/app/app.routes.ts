import { Routes } from '@angular/router';

export const routes: Routes = [
  
  // ============ LAYOUT PRINCIPAL (con navbar y footer) ============
  {
    path: '',
    loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: 'inicio', loadComponent: () => import('./features/inicio/inicio.component').then(m => m.InicioComponent) },
      { path: 'aprender', loadChildren: () => import('./features/aprender/aprender.module').then(m => m.AprenderModule) },
      { path: 'alimentarse', loadChildren: () => import('./features/alimentarse/alimentarse.module').then(m => m.AlimentarseModule) },
      { path: 'entrenamiento', loadChildren: () => import('./features/entrenamiento/entrenamiento.module').then(m => m.EntrenamientoModule) },
      { path: 'comunidad', loadChildren: () => import('./features/comunidad/comunidad.module').then(m => m.ComunidadModule) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },

  // ============ LAYOUT AUTH (sin navbar ni footer) ============
  {
    path: 'auth',
    loadComponent: () => import('./core/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) }
    ]
  },

  // ============ REDIRECCIONES ============
  { path: '**', redirectTo: 'inicio' }
];