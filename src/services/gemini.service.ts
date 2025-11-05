import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Briefing } from '../app.component';

export interface BriefingRequest {
  zemlja: string;
  grad: string;
  dob: string;
  spol: string;
  vrstaTure: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly ai: GoogleGenAI;

  constructor() {
    // IMPORTANT: The API key is sourced from environment variables for security.
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateBriefingPacket(request: BriefingRequest): Promise<Briefing> {
    const systemInstruction = `Usvoji persona uloge AI Sociokulturni Brifer (SCB) za turističku industriju. Cilj: Generiraj detaljan i trenutačno primjenjiv rapport-paket za vodiča, fokusiran na 'quick wins' u prvih 5 minuta interakcije. Izlazni Format: STROGO JSON OBJEKT (6 ključnih sekcija, koristeći hrvatski jezik za sve sekcije osim jezičnih primjera). Za kategorije koje su liste, pruži bogat i detaljan sadržaj.
    - Rapport_Jezicni_Starteri: Generiraj (a) Pozdrav i (b) Dvije popularne, opuštene rečenice (ice-breakers) na jeziku porijekla. Dodaj fonetski izgovor.
    - Grupne_Karakteristike: Navedi barem 3-5 ključnih karakteristika grupe, uključujući motivaciju i preferencije za formalnost/autoritet.
    - Kulturni_QuickWins: Navedi barem 5-10 kulturnih 'quick wins', uključujući popularne sportske klubove, tradicionalnu hranu, i pića iz navedenog grada i zemlje.
    - Psiholoski_Ponos: Navedi barem 5-10 točaka nacionalnog i lokalnog ponosa.
    - Logisticke_Taktike: Navedi barem 5 taktičkih savjeta za angažman specifičnih za vrstu ture (tempo, fokus na mikrofon, pauze).
    - Tabu_Osjetljivosti: Navedi barem 3-5 ključnih tema za izbjegavanje u prvom kontaktu.`;

    const userPrompt = `Zemlja=${request.zemlja}, Grad=${request.grad}, Dob=${request.dob}, Spol=${request.spol}, VrstaTure=${request.vrstaTure}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        Rapport_Jezicni_Starteri: {
          type: Type.ARRAY,
          description: "Greeting and two ice-breaker phrases in the group's native language, with phonetic pronunciation.",
          items: {
            type: Type.OBJECT,
            properties: {
              fraza: { type: Type.STRING, description: "The phrase in the native language." },
              fonetski: { type: Type.STRING, description: "Phonetic pronunciation." },
              tip: { type: Type.STRING, description: "Type of phrase (e.g., 'Pozdrav', 'Ice-breaker')." }
            },
            required: ["fraza", "fonetski", "tip"]
          }
        },
        Grupne_Karakteristike: {
          type: Type.ARRAY,
          description: "Characteristics of the group, like motivation and formality preferences.",
          items: { type: Type.STRING }
        },
        Kulturni_QuickWins: {
          type: Type.ARRAY,
          description: "Cultural quick wins like popular sports clubs, food, and drinks.",
          items: {
            type: Type.OBJECT,
            properties: {
              kategorija: { type: Type.STRING, description: "Category (e.g., 'Sportski Klub')." },
              vrijednost: { type: Type.STRING, description: "Value (e.g., 'FC Bayern München')." }
            },
             required: ["kategorija", "vrijednost"]
          }
        },
        Psiholoski_Ponos: {
          type: Type.ARRAY,
          description: "Points of psychological national and local pride.",
          items: {
            type: Type.OBJECT,
            properties: {
              kategorija: { type: Type.STRING, description: "Category (e.g., 'Nacionalni Ponos')." },
              vrijednost: { type: Type.STRING, description: "The point of pride." }
            },
            required: ["kategorija", "vrijednost"]
          }
        },
        Logisticke_Taktike: {
          type: Type.ARRAY,
          description: "Logistical tactics specific to the tour type.",
          items: { type: Type.STRING }
        },
        Tabu_Osjetljivosti: {
          type: Type.ARRAY,
          description: "Key topics to avoid in initial contact.",
          items: { type: Type.STRING }
        }
      },
      required: ["Rapport_Jezicni_Starteri", "Grupne_Karakteristike", "Kulturni_QuickWins", "Psiholoski_Ponos", "Logisticke_Taktike", "Tabu_Osjetljivosti"]
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        },
      });

      const jsonString = response.text.trim();
      const parsedData: Briefing = JSON.parse(jsonString);
      return parsedData;

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to fetch or parse briefing data from Gemini API.');
    }
  }
}