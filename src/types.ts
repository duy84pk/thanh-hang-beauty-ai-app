/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Staff' | 'Admin' | 'Customer';

export interface User {
  id: string;
  username: string;
  role: Role;
  name: string;
}

export interface ScanHistoryItem {
  id: string;
  date: string;
  staff: string;
  image: string;
  result: AnalysisResult;
  selectedCategories?: string[];
}

export interface Customer {
  id: string;
  fullName: string;
  dob: string;
  phone: string;
  usageCount: number;
  lastAnalysisDate?: string;
  assignedStaff?: string;
  history?: ScanHistoryItem[];
}

export interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: Record<string, {
    description: string;
    suggestion: string;
    service: string;
    price: string;
  }>;
}

export type Step = 1 | 2 | 3 | 4 | 5;

export interface AppState {
  currentRole: Role | null;
  currentUser: User | null;
  currentStep: Step;
  customerData: Partial<Customer> | null;
  capturedImage: string | null;
  analysisResult: AnalysisResult | null;
  selectedCategories: string[];
}
