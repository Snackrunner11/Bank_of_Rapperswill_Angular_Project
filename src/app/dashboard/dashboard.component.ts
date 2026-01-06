import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { AccountService, Transaction, AccountInfo, Owner } from '../account.service';

interface TransactionWithBalance extends Transaction {
  balance?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private accountService = inject(AccountService);
  private destroyRef = inject(DestroyRef);

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
      const storedLocal = localStorage.getItem('local_transactions');
      if (storedLocal) {
        try {
          this.localTransactions = JSON.parse(storedLocal);
        } catch (e) {
          console.error('Fehler beim Laden der lokalen Transaktionen', e);
          this.localTransactions = [];
        }
      }

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
    this.accountService.getAccountInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: AccountInfo) => {
          this.balance.set(data.balance);
          if (data.owner && data.owner.bban) {
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
    this.accountService.getTransactions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (serverList: Transaction[]) => {
          const myBban = this.accountNr();

          // Req 2.5
          const relevantServer = serverList.filter(tx => 
            (tx.source && tx.source === myBban) || 
            (tx.target && tx.target === myBban)
          );

          const relevantLocal = this.localTransactions.filter(tx =>
            (tx.source && tx.source === myBban) || 
            (tx.target && tx.target === myBban)
          );

          const demoTx = this.getDemoTransaction();
          
          const uniqueLocal = relevantLocal.filter(localTx => {
            return !relevantServer.some(serverTx => 
              serverTx.date === localTx.date && 
              Math.abs(serverTx.amount) === Math.abs(localTx.amount)
            );
          });

          let combined = [...relevantServer, ...uniqueLocal, demoTx];

          combined = combined.map(tx => {
            const t = { ...tx }; 
            
            if (t.target === myBban) {
              t.amount = Math.abs(t.amount); 
            } else if (t.source === myBban) {
              t.amount = -Math.abs(t.amount); 
            }
            return t;
          });

          this.allTransactions = combined.sort((a, b) => 
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          );
          
          this.recalculateTable();
        },
        error: (e) => {
          console.error('Tx Error:', e);
          const myBban = this.accountNr();
          const myLocal = this.localTransactions.filter(tx => 
            tx.source === myBban || tx.target === myBban
          );
          this.allTransactions = [...myLocal, this.getDemoTransaction()];
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
      this.accountService.getAccount(accNr)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: Owner) => {
             if (data && data.firstname) {
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
    const val = Number(this.amount());
    const target = this.toAccount();

    if (!val || val <= 0) {
      alert('Der Betrag muss positiv sein.');
      return;
    }
    if (val < 0.05) {
      alert('Der Betrag muss mindestens 0.05 CHF betragen.');
      return;
    }
    if (!target) {
      alert('Bitte Empfaenger angeben.');
      return;
    }

    this.accountService.executeTransaction(target, val)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const newTx: TransactionWithBalance = {
            amount: -val, 
            date: new Date().toISOString(),
            target: target,
            source: this.accountNr() || 'My Account'
          };

          this.localTransactions.push(newTx);
          localStorage.setItem('local_transactions', JSON.stringify(this.localTransactions));

          const newBal = this.balance() - val;
          this.balance.set(newBal);

          this.loadTransactions();

          this.lastPaymentTarget.set(target);
          this.lastPaymentBalance.set(newBal);
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