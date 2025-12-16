import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);

  username = signal('');
  password = signal('');

  onLogin() {
    const user = this.username();
    const pass = this.password();

    // Req 1.1: Eingaben (User/Passwort) nur akzeptieren, wenn > 3 Zeichen.
    if (user.length > 3 && pass.length > 3) {
      this.authService.login(user, pass);
    } else {
      alert('Benutzername und Passwort müssen länger als 3 Zeichen sein.');
    }
  }
}