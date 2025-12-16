import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Transaction {
  amount: number;
  date: string;
  target: string;
  source: string;
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

  getAccountInfo() {
    return this.http.get<any>(`${this.apiUrl}/accounts`, this.getHeaders());
  }

  // Req 2.2: Backend-Abfrage zur Validierung und Ermittlung des Empfängernamens.
  getAccount(accountNr: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/accounts/${accountNr}`, this.getHeaders()); 
  }

  // Req 2.5: Laden der Transaktionsliste vom Server für die Übersicht.
  getTransactions(): Observable<Transaction[]> {
    return this.http.get<any>(`${this.apiUrl}/accounts/transactions`, this.getHeaders())
      .pipe(
        map(response => {
          if (Array.isArray(response)) {
            return response;
          }
          if (response && Array.isArray(response.transactions)) {
            return response.transactions;
          }
          if (response && Array.isArray(response.results)) {
            return response.results;
          }
          return [];
        })
      );
  }

  // Req 2.1: Sendet die Zahlungsanweisung an das Backend.
  executeTransaction(target: string, amount: number) {
    const body = { target, amount };
    return this.http.post<any>(`${this.apiUrl}/accounts/transactions`, body, this.getHeaders()); 
  }
}