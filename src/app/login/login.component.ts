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

  hasMinLength = (min: number) => (value: string) => value.length > min;

  onLogin() {
    const user = this.username();
    const pass = this.password();

    // Req 1.1: Eingaben (User/Passwort) nur akzeptieren, wenn > 3 Zeichen.
    const isValidInput = this.hasMinLength(3);

    if (isValidInput(user) && isValidInput(pass)) {
      this.authService.login(user, pass);
    } else {
      alert('Benutzername und Passwort müssen länger als 3 Zeichen sein.');
    }
  }
}