// Project and Estimate Types
export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type EstimateStatus = 'draft' | 'pending' | 'approved' | 'contracted';

export interface Estimate {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: EstimateStatus;
  version: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  walls: Wall[];
  notes?: string; // <--- AGGIUNTO QUI
  projectName?: string; // <--- AGGIUNTO PER MOSTRARE IL NOME PROGETTO
}

// Wall and Stratigraphy Types
// This type represents the full set of wall types in the application
export type WallType = 
  | 'plating'      // Commonly used in the UI
  | 'counterwall'  // Commonly used in the UI
  | 'single'       // Commonly used in the UI
  | 'double'       // Commonly used in the UI
  | 'ceiling'      // Commonly used in the UI
  | 'internal'     // Legacy/extended type
  | 'external'     // Legacy/extended type
  | 'roof'         // Legacy/extended type  
  | 'foundation';  // Legacy/extended type

// This type represents the subset of wall types accepted by the database
export type DatabaseWallType = 
  | 'plating'
  | 'counterwall' 
  | 'single'
  | 'double'
  | 'ceiling';

export interface Wall {
  id: string;
  estimateId: string;
  name: string;
  type: WallType;
  stratigraphyId: string;
  area: number; // in square meters
  laborCost: number;
  accessoriesCost: number;
  totalCost: number;
  pricePerSqm: number;
}

export interface Stratigraphy {
  id: string;
  name: string;
  type: WallType;
  description: string;
  isCertified: boolean;
  certificationId?: string;
  layers: Layer[];
  totalThickness: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Layer {
  id: string;
  stratigraphyId: string;
  materialId: string;
  position: number;
  thickness: number; // in mm
}

// Material Types - Aggiornato con le nuove sottocategorie
export type MaterialCategory =
  | 'board'           // Lastre per pareti/contropareti (gesso rivestito, cementizia, gessofibra, velo vetro)
  | 'ceiling_tile'    // Pannelli sospesi a vista per controsoffitto (gesso rivestito a vista, lana minerale Eurocoustic, lana di vetro)
  | 'structure_frame' // Profili montanti / portanti
  | 'structure_guide' // Profili guida / cornici perimetrali
  | 'insulation'      // Isolanti termici/acustici (lana di roccia, lana di vetro, XPS, EPS, PIR)
  | 'accessory'       // Paraspigoli, nastri, clip, sospensioni, botole, sigillanti
  | 'screw'           // Viti dedicate al fissaggio lastre
  | 'finish'          // Finiture: intonaci, rasanti, primer, stucchi, malte, protezioni ignifughe
  | 'other';

export interface Material {
  id: string;
  category: MaterialCategory;
  code: string;
  name: string;
  description: string;
  manufacturer: string;
  unitPrice: number;
  unit: 'sqm' | 'piece' | 'meter';
  incidencePerSqm?: number;
  discount?: number;
  validUntil?: Date;
}

// Certification Types
export interface Certification {
  id: string;
  code: string;
  name: string;
  type: string; // EI, Rw, etc.
  value: string; // 60, 120, 45dB, etc.
  certifier: string;
  issueDate: Date;
  expiryDate: Date;
  documentUrl: string;
}

// User and Role Types
export type UserRole = 'user' | 'power_user' | 'technical_validator' | 'admin' | 'super_user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company: string;
}
