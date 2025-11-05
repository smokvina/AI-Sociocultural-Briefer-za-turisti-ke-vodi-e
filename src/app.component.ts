import { Component, ChangeDetectionStrategy, signal, inject, WritableSignal } from '@angular/core';
import { GeminiService, BriefingRequest } from './services/gemini.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Interfaces for the structured briefing data
interface LanguageStarter {
  fraza: string;
  fonetski: string;
  tip: string;
}

interface CategorizedItem {
  kategorija: string;
  vrijednost: string;
}

export interface Briefing {
  Rapport_Jezicni_Starteri: LanguageStarter[];
  Grupne_Karakteristike: string[];
  Kulturni_QuickWins: CategorizedItem[];
  Psiholoski_Ponos: CategorizedItem[];
  Logisticke_Taktike: string[];
  Tabu_Osjetljivosti: string[];
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  // Form state signals
  zemlja = signal('Njemačka');
  grad = signal('Berlin');
  dob = signal('26-40');
  spol = signal('Miješano');
  vrstaTure = signal('Razgled grada pješice');

  // UI state signals
  isLoading = signal(false);
  error: WritableSignal<string | null> = signal(null);
  briefingResult: WritableSignal<Briefing | null> = signal(null);

  // Dropdown options
  readonly ageRanges = ['18-25', '26-40', '41-60', '60+'];
  readonly genderStructures = ['Većinom muška', 'Većinom ženska', 'Miješano'];
  readonly tourTypes = ['Razgled grada pješice', 'Tura autobusom', 'Tura po muzeju', 'Pustolovna tura', 'Kulinarska tura', 'Povijesna pješačka tura', 'Tura po umjetničkoj galeriji'];

  async generateBriefing(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.briefingResult.set(null);

    const request: BriefingRequest = {
      zemlja: this.zemlja(),
      grad: this.grad(),
      dob: this.dob(),
      spol: this.spol(),
      vrstaTure: this.vrstaTure(),
    };

    try {
      const result = await this.geminiService.generateBriefingPacket(request);
      this.briefingResult.set(result);
    } catch (e) {
      console.error('Error generating briefing:', e);
      this.error.set('Došlo je do pogreške prilikom generiranja brifinga. Molimo pokušajte ponovno.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async exportAsPDF(): Promise<void> {
    const pdfContent = document.getElementById('pdfContent');
    if (!pdfContent || !this.briefingResult()) return;

    // Use html2canvas to render the element to a canvas
    const canvas = await html2canvas(pdfContent, {
      backgroundColor: '#1f2937', // Match the dark theme bg-gray-800
      scale: 2, // Increase scale for higher resolution
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions to fit the image
    const pdfWidth = canvas.width;
    const pdfHeight = canvas.height;
    
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const country = this.zemlja().replace(/\s/g, '_');
    const city = this.grad().replace(/\s/g, '_');
    pdf.save(`brifing_${country}_${city}.pdf`);
  }
}