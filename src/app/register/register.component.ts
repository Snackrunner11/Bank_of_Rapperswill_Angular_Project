import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink], // RouterLink für "Zurück zum Login"
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);

  // Req 1.5: Alle nötigen Felder als Signals
  firstName = signal('');
  lastName = signal('');
  username = signal('');
  password = signal('');
  confirmPassword = signal('');

  onRegister() {
    const fn = this.firstName();
    const ln = this.lastName();
    const user = this.username();
    const pass = this.password();
    const confirm = this.confirmPassword();

    // Req 1.7: Alle Felder > 3 Zeichen
    if (fn.length <= 3 || ln.length <= 3 || user.length <= 3 || pass.length <= 3) {
      alert('Alle Felder müssen länger als 3 Zeichen sein.');
      return;
    }

    // Req 1.6: Passwort Bestätigung identisch
    if (pass !== confirm) {
      alert('Passwörter stimmen nicht überein!');
      return;
    }

    // Wenn alles ok, Service aufrufen
    this.authService.register({
      firstName: fn,
      lastName: ln,
      username: user,
      password: pass
    });
  }
}