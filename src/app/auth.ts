import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; 

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Req 1.x & 2.x: HttpClient bereitstellen für Backend-Kommunikation
    provideHttpClient() 
  ]
};