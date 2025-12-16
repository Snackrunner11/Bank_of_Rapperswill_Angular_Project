import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RegisterComponent } from './register/register.component'; 

export const routes: Routes = [
  // Req 1.10: Startseite/Fallback leitet oft zum Login.
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Req 1.4 & 1.8: Ziel-Route für Redirects nach Login/Registrierung.
  { path: 'dashboard', component: DashboardComponent }
];