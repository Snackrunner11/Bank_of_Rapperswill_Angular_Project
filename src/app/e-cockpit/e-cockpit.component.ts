import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router'; 
import { AccountService, Transaction } from '../account.service';

interface TransactionUI extends Transaction {
  balanceAfter: number;
  dateObj: Date;
}

@Component({
  selector: 'app-e-cockpit',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './e-cockpit.component.html',
  styleUrl: './e-cockpit.component.css'
})
export class ECockpitComponent implements OnInit {
  private accountService = inject(AccountService);

  private rawTransactions = signal<TransactionUI[]>([]);
  private accountNr = signal('');

  activeTab = signal<string>('movements'); 

  selectedYear = signal<string>('Alle');
  selectedMonth = signal<string>('Alle');
  entriesPerPage = signal<number>(5); 
  currentPage = signal<number>(1);
  
  sortColumn = signal<keyof TransactionUI>('dateObj');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Req 3.2
  availableYears = computed(() => {
    const years = this.rawTransactions().map(t => t.dateObj.getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  });

  months = [
    { val: '0', name: 'Januar' }, { val: '1', name: 'Februar' }, { val: '2', name: 'März' },
    { val: '3', name: 'April' }, { val: '4', name: 'Mai' }, { val: '5', name: 'Juni' },
    { val: '6', name: 'Juli' }, { val: '7', name: 'August' }, { val: '8', name: 'September' },
    { val: '9', name: 'Oktober' }, { val: '10', name: 'November' }, { val: '11', name: 'Dezember' }
  ];

  // Req 3.2
  filteredTransactions = computed(() => {
    let data = this.rawTransactions();
    const y = this.selectedYear();
    const m = this.selectedMonth();

    return data.filter(t => {
      const matchYear = y === 'Alle' || t.dateObj.getFullYear().toString() === y;
      const matchMonth = m === 'Alle' || t.dateObj.getMonth().toString() === m;
      return matchYear && matchMonth;
    });
  });

  // Req 3.3
  sortedTransactions = computed(() => {
    const data = [...this.filteredTransactions()];
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return data.sort((a, b) => {
      const valA = a[col];
      const valB = b[col];
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  });

  // Req 3.1 & Req 3.4
  paginatedTransactions = computed(() => {
    const data = this.sortedTransactions();
    const start = (this.currentPage() - 1) * this.entriesPerPage();
    const end = start + this.entriesPerPage();
    return data.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredTransactions().length / this.entriesPerPage());
  });

  pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  // Req 3.5
  balanceChartPath = computed(() => {
    const data = this.filteredTransactions();
    if (data.length < 2) return '';

    const sortedForGraph = [...data].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    const balances = sortedForGraph.map(t => t.balanceAfter);
    const minBal = Math.min(...balances);
    const maxBal = Math.max(...balances);
    
    const width = 1000;
    const height = 300;
    const padding = 20;

    const rangeY = maxBal - minBal || 1; 
    const stepX = (width - 2 * padding) / (sortedForGraph.length - 1);

    const points = sortedForGraph.map((t, index) => {
      const x = padding + index * stepX;
      const normalizedY = (t.balanceAfter - minBal) / rangeY;
      const y = height - padding - (normalizedY * (height - 2 * padding));
      return `${x},${y}`;
    });

    return points.join(' ');
  });

  ngOnInit() {
    this.accountService.getAccountInfo().subscribe({
      next: (info) => {
        this.accountNr.set(info.owner?.bban || '');
        const currentBal = info.balance;
        
        this.accountService.getTransactions().subscribe({
          next: (serverTxs) => {
            this.processData(serverTxs, currentBal);
          },
          error: () => {
             this.processData([], currentBal);
          }
        });
      },
      error: (err) => {
         this.processData([], 0);
      }
    });
  }

  getDemoTransaction(): Transaction {
    return {
      amount: 1000.00,
      date: new Date(2023, 0, 1).toISOString(),
      target: this.accountNr(),
      source: 'Bank Intern (Gutschrift)'
    };
  }

  processData(serverTxs: Transaction[], currentBal: number) {
    const myBban = this.accountNr();

    let localTransactions: Transaction[] = [];
    try {
      const stored = localStorage.getItem('local_transactions');
      if (stored) {
        localTransactions = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    const relevantLocal = localTransactions.filter(tx => 
        (tx.source && tx.source === myBban) || 
        (tx.target && tx.target === myBban)
    );

    const relevantServer = serverTxs.filter(tx => 
      (tx.source && tx.source === myBban) || 
      (tx.target && tx.target === myBban)
    );

    const uniqueLocal = relevantLocal.filter(localTx => {
      return !relevantServer.some(serverTx => 
        serverTx.date === localTx.date && 
        Math.abs(serverTx.amount) === Math.abs(localTx.amount)
      );
    });

    let combined = [...relevantServer, ...uniqueLocal, this.getDemoTransaction()];

    combined.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    let runningBalance = currentBal;

    const uiData: TransactionUI[] = combined.map(tx => {
      const t = { ...tx }; 

      if (t.target === myBban) {
        t.amount = Math.abs(t.amount);
      } else if (t.source === myBban) {
        t.amount = -Math.abs(t.amount);
      }
      
      const entry: TransactionUI = {
        ...t,
        dateObj: new Date(t.date),
        balanceAfter: runningBalance
      };

      runningBalance = runningBalance - t.amount;

      return entry;
    });

    this.rawTransactions.set(uiData);
  }

  // Req 3.3
  toggleSort(col: keyof TransactionUI) {
    if (this.sortColumn() === col) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(col: string) {
    if (this.sortColumn() !== col) return '↕';
    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }
}