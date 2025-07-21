// Dynamic template interfaces for flexible form generation
export type FieldType = 'text' | 'dropdown' | 'date' | 'number' | 'textarea' | 'checkbox' | 'radio';

// Represents a single field in a template; options is only needed for dropdown, radio, or checkbox
export interface TemplateField {
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
}

// The body of a template, containing an array of fields
export interface TemplateBody {
  fields: TemplateField[];
}

// Main template interface, fully dynamic
export interface Template {
  name: string;
  body: TemplateBody;
  file: string;
  id?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Generic form data type for any template
export interface TemplateFormData {
  [fieldLabel: string]: string | number | boolean | Date;
}

// This structure is fully dynamic: add any fields, types, and options as needed in your templates.