import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);

  firstName = signal('');
  lastName = signal('');
  username = signal('');
  password = signal('');
  confirmPassword = signal('');

  isValid = computed(() => {
    return (
      this.firstName().length > 3 &&
      this.lastName().length > 3 &&
      this.username().length > 3 &&
      this.password().length > 3 &&
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