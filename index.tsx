
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { importProvidersFrom } from '@angular/core';

import { AppComponent } from './src/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(FormsModule),
  ],
});

// AI Studio always uses an `index.tsx` file for all project types.
