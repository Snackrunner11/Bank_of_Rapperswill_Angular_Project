import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Startet die App mit der Konfiguration (inkl. HttpClient für Req 1.x/2.x)
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));