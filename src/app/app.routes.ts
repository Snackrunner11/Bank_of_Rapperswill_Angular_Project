import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RegisterComponent } from './register/register.component';
import { ECockpitComponent } from './e-cockpit/e-cockpit.component';

export const routes: Routes = [
  // Req 1.10: Startseite/Fallback
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Req 1.4 & 1.8: Haupt-Dashboard
  { path: 'dashboard', component: DashboardComponent },
  
  // Req 3.x: e-Cockpit Modul
  { path: 'cockpit', component: ECockpitComponent }
];