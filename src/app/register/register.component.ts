import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);

  // Req 1.5: Angabe Vorname, Nachname, Benutzername, Passwort möglich.
  firstName = signal('');
  lastName = signal('');
  username = signal('');
  password = signal('');
  confirmPassword = signal('');

  isValid = computed(() => {
    return (
      // Req 1.7: Nur Eingaben mit mehr als 3 Zeichen akzeptieren.
      this.firstName().length > 3 &&
      this.lastName().length > 3 &&
      this.username().length > 3 &&
      this.password().length > 3 &&
      // Req 1.6: Registrierung nur möglich, wenn Password Confirmation identisch ist.
      this.password() === this.confirmPassword()
    );
  });

  onRegister() {
    if (!this.isValid()) {
      alert('Bitte überprüfe deine Eingaben (Länge > 3 und Passwörter gleich).');
      return;
    }

    this.authService.register({
      firstName: this.firstName(), 
      lastName: this.lastName(),
      login: this.username(),
      password: this.password()
    });
  }
}