import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { AccountService, Transaction } from '../account.service';

interface TransactionWithBalance extends Transaction {
  balance?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private accountService = inject(AccountService);

  balance = signal(0);
  accountNr = signal('');
  
  toAccount = signal('');
  amount = signal<number | null>(null);
  recipientName = signal('');
  
  paymentSuccess = signal(false);
  lastPaymentTarget = signal('');
  lastPaymentBalance = signal(0);
  
  allTransactions: TransactionWithBalance[] = [];
  visibleTransactions: TransactionWithBalance[] = [];
  private localTransactions: TransactionWithBalance[] = [];
  
  currentPage = 1;
  pageSize = 10;

  ngOnInit() {
    if (localStorage.getItem('token')) {
      this.allTransactions = [this.getDemoTransaction()];
      this.updatePaging();
      this.refreshAll();
    } else {
      this.authService.logout();
    }
  }

  getDemoTransaction(): TransactionWithBalance {
    return {
      amount: 1000.00,
      date: new Date(2023, 0, 1).toISOString(),
      target: this.accountNr(),
      source: 'Bank Intern (Gutschrift)'
    };
  }

  refreshAll() {
    this.loadAccountData();
  }

  loadAccountData() {
    this.accountService.getAccountInfo().subscribe({
      next: (data) => {
        if (data && typeof data.balance === 'number') {
          this.balance.set(data.balance);
        }
        if (data && data.owner && data.owner.bban) {
          this.accountNr.set(data.owner.bban);
        }
        this.loadTransactions();
      },
      error: (e) => {
        console.error('Account Error:', e);
        this.loadTransactions();
      }
    });
  }

  loadTransactions() {
    // Req 2.5: Vergangene Transaktionen sollen als Übersicht dargestellt werden.
    this.accountService.getTransactions().subscribe({
      next: (data: any) => {
        let serverList: TransactionWithBalance[] = [];
        
        if (Array.isArray(data)) serverList = data;
        else if (data && Array.isArray(data.transactions)) serverList = data.transactions;
        else if (data && Array.isArray(data.results)) serverList = data.results;

        const demoTx = this.getDemoTransaction();
        const uniqueLocal = this.localTransactions.filter(localTx => {
          return !serverList.some(serverTx => 
            serverTx.date === localTx.date && serverTx.amount === localTx.amount
          );
        });

        const combined = [...serverList, ...uniqueLocal, demoTx];
        this.allTransactions = combined.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        
        this.recalculateTable();
      },
      error: (e) => {
        console.error('Tx Error:', e);
        this.allTransactions = [...this.localTransactions, this.getDemoTransaction()];
        this.updatePaging();
      }
    });
  }

  recalculateTable() {
    if (!this.allTransactions.length) return;
    let runningBalance = this.balance();
    this.allTransactions.forEach(tx => {
      tx.balance = runningBalance;
      runningBalance = runningBalance - tx.amount;
    });
    this.updatePaging();
  }

  updatePaging() {
    // Req 2.7: Bei Listen > 10 Transaktionen soll Paging möglich sein.
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.visibleTransactions = this.allTransactions.slice(start, end);
  }

  nextPage() {
    if ((this.currentPage * this.pageSize) < this.allTransactions.length) {
      this.currentPage++;
      this.updatePaging();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaging();
    }
  }

  checkRecipient(accNr: string) {
    this.toAccount.set(accNr);
    if (accNr.length > 2) {
      this.accountService.getAccount(accNr).subscribe({
        next: (data) => {
          if (data && data.firstname) {
             // Req 2.2: Gültige Empfänger sollen direkt angezeigt werden.
             this.recipientName.set(`${data.firstname} ${data.lastname}`);
          } else {
             this.recipientName.set('Unknown account number specified');
          }
        },
        error: () => {
          this.recipientName.set('Unknown account number specified');
        }
      });
    } else {
      this.recipientName.set('');
    }
  }

  onPay() {
    // Req 2.1: Benutzer soll neue Zahlungen auslösen können.
    const val = Number(this.amount());
    const target = this.toAccount();

    if (!val || val <= 0) {
      alert('Der Betrag muss positiv sein.');
      return;
    }
    // Req 2.3: Nur Beträge >= 0.05 CHF übertragen.
    if (val < 0.05) {
      alert('Der Betrag muss mindestens 0.05 CHF betragen.');
      return;
    }
    if (!target) {
      alert('Bitte Empfänger angeben.');
      return;
    }

    this.accountService.executeTransaction(target, val).subscribe({
      next: () => {
        const newTx: TransactionWithBalance = {
          amount: -val,
          date: new Date().toISOString(),
          target: target,
          source: this.accountNr() || 'My Account'
        };

        this.localTransactions.push(newTx);
        const newBal = this.balance() - val;
        this.balance.set(newBal);

        // Req 2.6: Nach Zahlung soll Transaktion automatisch in Übersicht erscheinen.
        this.loadTransactions();

        this.lastPaymentTarget.set(target);
        this.lastPaymentBalance.set(newBal);
        
        // Req 2.4: Erfolgreiche Transaktion soll bestätigt werden.
        this.paymentSuccess.set(true);
      },
      error: (err) => {
         const msg = err.error?.message || 'Transaction failed';
         alert(msg);
      }
    });
  }

  onStartOver() {
    this.paymentSuccess.set(false);
    this.amount.set(null);
    this.toAccount.set('');
    this.recipientName.set('');
    this.refreshAll(); 
  }

  onLogout() {
    this.authService.logout();
  }
}