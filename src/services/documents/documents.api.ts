// Usage example for updating a document from a parent component:
//
// import { updateDocument } from '@/services/documents/documents.api';
//
// const handleSave = async (updatedDoc: FilledDocument) => {
//   await updateDocument(updatedDoc.id, updatedDoc);
//   // Optionally: refresh data, close dialog, show notification, etc.
// };
//
// <DocumentDialog
//   isOpen={isOpen}
//   onClose={handleClose}
//   document={selectedDocument}
//   mode={mode}
//   onSave={handleSave}
// />

import axios from '@/plugin/axios';
import { FilledDocument } from '@/interfaces/Document';




// Get all documents (with optional query params for filtering, pagination, etc.)
export const fetchDocuments = async (params?: Record<string, any>, config?: Record<string, any> ): Promise<FilledDocument[]> => {
  const response = await axios.get<FilledDocument[]>('document/all/', { params, ...config, });
  return response.data;
};


// Get a single document by ID
export const fetchDocumentById = async (id: string): Promise<FilledDocument> => {
  const response = await axios.get<FilledDocument>(`document/all/${id}/`);
  return response.data;
};


// Create a new document
export const createDocument = async (data: FilledDocument): Promise<FilledDocument> => {
  const response = await axios.post<FilledDocument>('document/all/', data);
  return response.data;
};


// Update an existing document by ID
export const updateDocument = async (id: string, data: Partial<FilledDocument>): Promise<FilledDocument> => {
  const response = await axios.put<FilledDocument>(`document/${id}/`, data);
  return response.data;
};


// Delete a document by ID
export const deleteDocument = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await axios.delete<{ success: boolean; message?: string }>(`document/${id}/`);
  return response.data;
};

