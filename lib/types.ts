export type Bewertung = "gruen" | "gelb" | "rot";

export interface Annotation {
  text: string;
  bewertung: Bewertung;
  erklaerung: string;
}
