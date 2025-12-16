import { Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, NgIf } from '@angular/common'; // Für Währungsanzeige
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, NgIf],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private authService = inject(AuthService);

  // Zahlungs-Formular State
  toAccount = signal('');
  amount = signal(0);
  
  // Req 2.2: Info zum Empfänger (Mock-Daten)
  recipientName = signal('');

  constructor() {
    // Effekt: Reagiert auf Änderungen der Kontonummer (für Req 2.2)
    effect(() => {
      const acc = this.toAccount();
      // Einfache Simulation einer Prüfung
      if (acc === 'CH123456') {
        this.recipientName.set('Max Mustermann');
      } else if (acc.length > 5) {
        this.recipientName.set('Unbekannter Empfänger');
      } else {
        this.recipientName.set('');
      }
    });
  }

  onLogout() {
    this.authService.logout();
  }

  onPay() {
    const val = this.amount();
    
    // Req 2.3: Betrag >= 0.05
    if (val < 0.05) {
      alert('Der Betrag muss mindestens 0.05 CHF betragen.');
      return;
    }

    if (this.toAccount().length < 3) {
      alert('Bitte gültiges Empfängerkonto angeben.');
      return;
    }

    console.log(`Zahlung von ${val} an ${this.toAccount()} ausgelöst.`);
    alert('Zahlung erfolgreich!');
    
    // Reset Form
    this.amount.set(0);
    this.toAccount.set('');
  }
}