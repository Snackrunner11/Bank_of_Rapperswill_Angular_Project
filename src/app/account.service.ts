import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Owner {
  firstname: string;
  lastname: string;
  bban: string;
}

export interface AccountInfo {
  balance: number;
  owner: Owner;
}

export interface Transaction {
  amount: number;
  date: string;
  target: string;
  source: string;
}

interface TransactionResponse {
  results?: Transaction[];
  transactions?: Transaction[];
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1';

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}` 
      })
    };
  }

  getAccountInfo(): Observable<AccountInfo> {
    return this.http.get<AccountInfo>(`${this.apiUrl}/accounts`, this.getHeaders());
  }

  // Req 2.2: Backend-Abfrage zur Validierung und Ermittlung des Empfängernamens.
  getAccount(accountNr: string): Observable<Owner> {
    return this.http.get<Owner>(`${this.apiUrl}/accounts/${accountNr}`, this.getHeaders()); 
  }

  // Req 2.5: Laden der Transaktionsliste vom Server für die Übersicht.
  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[] | TransactionResponse>(`${this.apiUrl}/accounts/transactions`, this.getHeaders())
      .pipe(
        map(response => {
          if (Array.isArray(response)) {
            return response;
          }
          if ('transactions' in response && Array.isArray(response.transactions)) {
            return response.transactions;
          }
          if ('results' in response && Array.isArray(response.results)) {
            return response.results;
          }
          return [];
        })
      );
  }

  // Req 2.1: Sendet die Zahlungsanweisung an das Backend.
  executeTransaction(target: string, amount: number): Observable<void> {
    const body = { target, amount };
    return this.http.post<void>(`${this.apiUrl}/accounts/transactions`, body, this.getHeaders()); 
  }
}