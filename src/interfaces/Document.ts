
// --- Model Interfaces for Filled Document Instance ---

export interface Assignature {
  id: number | string;
  sign_img: string;
  status: boolean;
  signed_date: string | null;
}

export interface Remarks {
  [key: string]: any;
}

export interface FilledDocument {
  name: string;
  status: number | string;
  created_by: number | string;
  submitted_by: string;
  template: number | string;
  document_data: { [field: string]: string | number | boolean | Date };
  assignatures: Assignature[];
  remarks?: Remarks;
  department?: string;
  [key: string]: any;
}
