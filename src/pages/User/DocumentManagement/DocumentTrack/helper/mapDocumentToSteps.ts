// Update the import path if the location is incorrect, or create the file if missing.
import { FilledDocument } from '@/interfaces/Document';

export interface TrackingStepData {
  id: string;
  title: string;
  description: string;
  status: string;
  date?: string;
  assignedTo?: string;
}

export const mapDocumentToSteps = (doc: FilledDocument): TrackingStepData[] => [
  {
    id: '1',
    title: 'Document Submitted',
    description: `Submitted by ${doc.submitted_by}`,
    status: Number(doc.status) >= 1 ? 'completed' : 'pending',
    date: doc.date_created ? new Date(doc.date_created).toLocaleString() : undefined,
    assignedTo: doc.submitted_by
  },
  {
    id: '2',
    title: 'Initial Review',
    description: doc.assignatures && doc.assignatures[0] ? `Reviewed by ${doc.assignatures[0].name}` : 'Awaiting review',
    status: Number(doc.status) >= 2 ? 'completed' : Number(doc.status) === 1 ? 'current' : 'pending',
    date: doc.assignatures && doc.assignatures[0]?.signed_date ? new Date(doc.assignatures[0].signed_date).toLocaleString() : undefined,
    assignedTo: doc.assignatures && doc.assignatures[0]?.name
  },
  {
    id: '3',
    title: 'Final Approval',
    description: 'Document completed',
    status: Number(doc.status) === 3 ? 'completed' : 'pending',
    date: doc.last_modified ? new Date(doc.last_modified).toLocaleString() : undefined,
    assignedTo: "Supply Office"
  }
];
