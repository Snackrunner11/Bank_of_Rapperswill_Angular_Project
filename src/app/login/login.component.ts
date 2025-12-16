import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);

  // State Management mit Signals
  username = signal('');
  password = signal('');

  // Event Handler für Login-Button
  onLogin() {
    const user = this.username();
    const pass = this.password();

    // Anforderung 1.1: Validierung (Länge > 3 Zeichen)
    if (user.length > 3 && pass.length > 3) {
      this.authService.login(user, pass);
    } else {
      alert('Benutzername und Passwort müssen länger als 3 Zeichen sein.');
    }
  }
}