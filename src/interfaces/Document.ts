
// --- Model Interfaces for Filled Document Instance ---

export interface Assignature {
  id: number | string;
  name: string;
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
  to_route: string;
  assignatures: Assignature[];
  remarks?: Remarks;
  department?: string;
  tracking_id?: string;
  [key: string]: any;
}

// Status description mapping for UI
export const statusDescriptionMap: Record<number, (doc: FilledDocument) => string> = {
  1: (doc) => `${doc.submitted_by} submitted a document named "${doc.name}", \n for approval to ${doc.assignatures && doc.assignatures[0].name ? doc.assignatures[0].name : '[Next Approver]'}.
  `,
  2: (doc) => `The file is already approved by ${doc.assignatures && doc.assignatures[0].name ? doc.assignatures[0].name : '[First Approver]'}. In route to Supply Office, for PR Number.`,
  3: (doc) => `The document has already a PR Number "${doc.tracking_id || ''}" and already completed.`
};
