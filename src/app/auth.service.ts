import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

export interface RegisterData {
  firstName: string; 
  lastName: string;
  login: string;     
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = '/api/v1'; 

  currentUser = signal('');

  constructor() {
    const firstName = localStorage.getItem('user_first_name');
    const lastName = localStorage.getItem('user_last_name');
    if (firstName && lastName) {
      this.currentUser.set(`${firstName} ${lastName}`);
    }
  }

  login(username: string, password: string) {
    const payload = { login: username, password: password };

    this.http.post<any>(`${this.apiUrl}/auth/login`, payload)
      .subscribe({
        next: (response) => {
          // Req 1.2: Das Login soll auf dem vom Backend gelieferten JWT Token basieren.
          const token = response.token || response.accessToken || response.jwt;
          
          if (token) {
            // Req 1.3: JWT Token (inkl. Name) im Local Storage hinterlegen.
            localStorage.setItem('token', token);
            
            if (response.owner) {
               localStorage.setItem('user_first_name', response.owner.firstname);
               localStorage.setItem('user_last_name', response.owner.lastname);
               this.currentUser.set(`${response.owner.firstname} ${response.owner.lastname}`);
            }
            
            // Req 1.4: Nach Login direkt auf Dashboard weiterleiten.
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          console.error('Login Fehler:', err);
          alert('Login fehlgeschlagen! Bitte überprüfe deine Daten.');
        }
      });
  }

  register(data: RegisterData) {
    const payload = {
      login: data.login,
      firstname: data.firstName,
      lastname: data.lastName,
      password: data.password
    };

    this.http.post<any>(`${this.apiUrl}/auth/register`, payload)
      .subscribe({
        next: (response) => {
          console.log('Register Response:', response);

          const token = response.token || response.accessToken || response.jwt;

          if (token) {
            localStorage.setItem('token', token);
            if (response.owner) {
               localStorage.setItem('user_first_name', response.owner.firstname);
               localStorage.setItem('user_last_name', response.owner.lastname);
               this.currentUser.set(`${response.owner.firstname} ${response.owner.lastname}`);
            }
            // Req 1.8: Nach Registration direkt auf Dashboard weiterleiten.
            this.router.navigate(['/dashboard']);
          } else {
            this.login(data.login, data.password);
          }
        },
        error: (err) => {
          console.error('Register Error:', err);
          alert('Registrierung fehlgeschlagen! Benutzername existiert eventuell schon.');
        }
      });
  }

  logout() {
    // Req 1.9: Logout löscht Token aus Local Storage.
    // Geändert: Nur spezifische Items löschen, damit Transaktionen erhalten bleiben
    localStorage.removeItem('token');
    localStorage.removeItem('user_first_name');
    localStorage.removeItem('user_last_name');

    this.currentUser.set('');
    
    // Req 1.10: Nach Logout auf Login Seite weiterleiten.
    this.router.navigate(['/login']);
  }
}