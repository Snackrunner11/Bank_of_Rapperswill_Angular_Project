import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Interface für Registrierungsdaten
export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/api'; // Beispiel-URL

  // --- LOGIN (Bereits vorhanden) ---
  login(username: string, password: string) {
    this.http.post<{token: string, firstName: string, lastName: string}>(`${this.apiUrl}/login`, { username, password })
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user_first_name', response.firstName);
          localStorage.setItem('user_last_name', response.lastName);
          this.router.navigate(['/dashboard']); // Req 1.4
        },
        error: () => alert('Login fehlgeschlagen')
      });
  }

  // --- NEU: REGISTRIERUNG (Req 1.5, 1.8) ---
  register(data: RegisterData) {
    this.http.post<{token: string}>(`${this.apiUrl}/register`, data)
      .subscribe({
        next: (response) => {
          // Direkt einloggen nach Registrierung (Token speichern)
          localStorage.setItem('token', response.token);
          localStorage.setItem('user_first_name', data.firstName);
          localStorage.setItem('user_last_name', data.lastName);
          
          // Req 1.8: Weiterleitung zum Dashboard
          this.router.navigate(['/dashboard']);
        },
        error: (err) => alert('Registrierung fehlgeschlagen')
      });
  }

  // --- NEU: LOGOUT (Req 1.9, 1.10) ---
  logout() {
    // Req 1.9: Token löschen
    localStorage.removeItem('token');
    localStorage.removeItem('user_first_name');
    localStorage.removeItem('user_last_name');
    
    // Req 1.10: Weiterleitung zum Login
    this.router.navigate(['/login']);
  }
}