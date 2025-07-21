
import axios from '@/plugin/axios';
import { Template } from '@/interfaces/Templates';

// Get all templates
export const fetchTemplates = async (params?: Record<string, any>): Promise<Template[]> => {
  const response = await axios.get<Template[]>('template/all/', { params });
  return response.data;
};

// Get a single template by ID
export const fetchTemplateById = async (id: string): Promise<Template> => {
  const response = await axios.get<Template>(`template/all/${id}/`);
  return response.data;
};

// Create a new template
export const createTemplate = async (data: Template): Promise<Template> => {
  const response = await axios.post<Template>('template/all/', data);
  return response.data;
};

// Update an existing template by ID
export const updateTemplate = async (id: string, data: Partial<Template>): Promise<Template> => {
  const response = await axios.put<Template>(`template/all/${id}/`, data);
  return response.data;
};

// Delete a template by ID
export const deleteTemplate = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await axios.delete<{ success: boolean; message?: string }>(`template/all/${id}/`);
  return response.data;
};
