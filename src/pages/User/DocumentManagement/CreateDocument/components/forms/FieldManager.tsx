import React, { useState } from 'react';
import { Trash2, Edit, Plus, Upload, X, Users, GripVertical, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { evaluate } from 'mathjs';

// Add to your Field interface
export interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'table' | 'list' | 'textarea' | 'email' | 'image' | 'group';
  required: boolean;
  options?: string[];
  coordinates: { x: number; y: number; width: number; height: number } | null;
  page: number;
  listConfig?: {
    minItems: number;
    maxItems: number;
    columns: any[];
  };
  tableConfig?: {
    rows: number;
    columns: { id: string; label: string; width?: string; type?: string; formula?: string; options?: string[] }[];
    data: any[];
    borderStyle?: {
      borderWidth: string;
      borderColor: string;
      borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
    };
  };
  groupConfig?: {
    fields: Field[];
    additionalFields?: any[]; // For non-visual fields
  };
  style?: {
    fontSize: string;
    color: string;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
  };
  // New properties for field management
  order?: number;
  height?: number;
  visible?: boolean;
  formula?: string; // For arithmetic operations like Excel
}

// Helper function to generate ID from label
const generateIdFromLabel = (label: string): string => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

interface FieldManagerProps {
  fields: Field[];
  setFields: (fields: Field[]) => void;
  showPreviewMode: boolean;
  previewValues: Record<string, any>;
  setPreviewValues: (values: Record<string, any>) => void;
  currentField: Field;
  setCurrentField: (field: Field) => void;
  showFieldModal: boolean;
  setShowFieldModal: (show: boolean) => void;
  editingField: Field | null;
  setEditingField: (field: Field | null) => void;
}

export const FieldManager: React.FC<FieldManagerProps> = ({
  fields,
  setFields,
  showPreviewMode,
  previewValues,
  setPreviewValues,
  currentField,
  setCurrentField,
  showFieldModal,
  setShowFieldModal,
  editingField,
  setEditingField
}) => {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [additionalFields, setAdditionalFields] = useState<any[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedItem(fieldId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    setDragOverItem(fieldId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetFieldId) return;

    const draggedIndex = fields.findIndex(f => f.id === draggedItem);
    const targetIndex = fields.findIndex(f => f.id === targetFieldId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newFields = [...fields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, draggedField);

    // Update order property
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      order: index
    }));

    setFields(updatedFields);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Field ordering functions
  const moveFieldUp = (fieldId: string) => {
    const currentIndex = fields.findIndex(f => f.id === fieldId);
    if (currentIndex > 0) {
      const newFields = [...fields];
      [newFields[currentIndex - 1], newFields[currentIndex]] = [newFields[currentIndex], newFields[currentIndex - 1]];
      
      // Update order property
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        order: index
      }));
      
      setFields(updatedFields);
    }
  };

  const moveFieldDown = (fieldId: string) => {
    const currentIndex = fields.findIndex(f => f.id === fieldId);
    if (currentIndex < fields.length - 1) {
      const newFields = [...fields];
      [newFields[currentIndex], newFields[currentIndex + 1]] = [newFields[currentIndex + 1], newFields[currentIndex]];
      
      // Update order property
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        order: index
      }));
      
      setFields(updatedFields);
    }
  };

  // Toggle field visibility
  const toggleFieldVisibility = (fieldId: string) => {
    const updatedFields = fields.map(field => 
      field.id === fieldId 
        ? { ...field, visible: field.visible !== false ? false : true }
        : field
    );
    setFields(updatedFields);
  };

  // Evaluate formula for a field
  const evaluateFormula = (formula: string, fieldId: string, rowIndex?: number, evaluatingFields: Set<string> = new Set()): number | string => {
    if (!formula) return '';
    
    // Prevent circular references
    if (evaluatingFields.has(fieldId)) {
      console.warn(`Circular reference detected for field: ${fieldId}`);
      return 'Circular Ref';
    }
    
    const currentEvaluatingFields = new Set(evaluatingFields);
    currentEvaluatingFields.add(fieldId);
    
    try {
      // Replace field IDs in formula with their values
      let expression = formula;
      
      // Find all field references (including table cells and group fields)
      const fieldReferences = formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?(_\d+_\d+)?\b/g) || [];
      
      fieldReferences.forEach(ref => {
        // Don't replace if it's the same field (to avoid circular reference)
        if (ref === fieldId) return;
        
        let value = 0;
        
        // Handle table cell references with specific format (table.column)
        if (ref.includes('.') && !ref.includes('_')) {
          const [tableId, columnId] = ref.split('.');
          const tableField = fields.find(f => f.id === tableId && f.type === 'table');
          if (tableField && tableField.tableConfig?.columns) {
            // Try to find column by exact ID match first
            let columnIndex = tableField.tableConfig.columns.findIndex(col => col.id === columnId);
            
            // If not found by ID, try by generated ID from label
            if (columnIndex === -1) {
              columnIndex = tableField.tableConfig.columns.findIndex(col => 
                generateIdFromLabel(col.label) === columnId
              );
            }
            
            if (columnIndex >= 0) {
              const currentRowIndex = rowIndex ?? 0;
              const cellKey = `${tableId}_${currentRowIndex}_${columnIndex}`;
              const cellValue = previewValues[cellKey];
              
              // If cell has no value but column has a formula, evaluate it
              if ((!cellValue || cellValue === '') && tableField.tableConfig.columns[columnIndex].formula) {
                try {
                  const column = tableField.tableConfig.columns[columnIndex];
                  if (column.formula) {
                    const calculatedValue = evaluateFormula(column.formula, `${tableId}.${column.id}`, currentRowIndex, currentEvaluatingFields);
                    value = parseFloat(calculatedValue.toString()) || 0;
                  }
                } catch (error) {
                  value = 0;
                }
              } else {
                value = parseFloat(cellValue) || 0;
              }
            }
          }
        }
        // Handle table cell references (e.g., table1_0_1)
        else if (ref.includes('_') && /\d+_\d+$/.test(ref)) {
          value = parseFloat(previewValues[ref]) || 0;
        }
        // Handle group field references (e.g., group1.field2)
        else if (ref.includes('.')) {
          const [groupId, subFieldId] = ref.split('.');
          const groupData = previewValues[groupId] || {};
          value = parseFloat(groupData[subFieldId]) || 0;
        }
        // Handle regular field references
        else if (previewValues[ref] !== undefined) {
          value = parseFloat(previewValues[ref]) || 0;
        }
        // Handle references to other formula fields
        else {
          const referencedField = fields.find(f => f.id === ref);
          if (referencedField && referencedField.formula && referencedField.type === 'number') {
            // Recursively evaluate the referenced formula field
            try {
              const calculatedValue = evaluateFormula(referencedField.formula, referencedField.id, rowIndex, currentEvaluatingFields);
              value = parseFloat(calculatedValue.toString()) || 0;
            } catch (error) {
              value = 0;
            }
          }
        }
        
        // Replace the reference with its value in the expression
        expression = expression.replace(new RegExp(`\\b${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), value.toString());
      });
      
      // Evaluate the mathematical expression
      const result = evaluate(expression);
      return typeof result === 'number' ? parseFloat(result.toFixed(2)) : result;
    } catch (error) {
      return 'Error';
    }
  };

  // Update field height
  const updateFieldHeight = (fieldId: string, height: number) => {
    const updatedFields = fields.map(field => 
      field.id === fieldId 
        ? { ...field, height: Math.max(20, Math.min(500, height)) } // Min 20px, Max 500px
        : field
    );
    setFields(updatedFields);
  };

  // Table management functions
  const addTableColumn = () => {
    const newColumn = {
      id: generateIdFromLabel(`column_${(currentField.tableConfig?.columns?.length || 0) + 1}`),
      label: `Column ${(currentField.tableConfig?.columns?.length || 0) + 1}`,
      width: 'auto',
      type: 'text',
      formula: '',
      options: []
    };

    setCurrentField({
      ...currentField,
      tableConfig: {
        ...currentField.tableConfig!,
        columns: [...(currentField.tableConfig?.columns || []), newColumn]
      }
    });
  };

  const updateTableColumn = (index: number, updatedColumn: Partial<{ id: string; label: string; width: string; type: string; formula: string; options: string[] }>) => {
    const newColumns = [...(currentField.tableConfig?.columns || [])];
    const existingColumn = newColumns[index];
    
    // Ensure column always has an ID
    let columnId = existingColumn?.id;
    if (updatedColumn.label) {
      columnId = generateIdFromLabel(updatedColumn.label);
    } else if (!columnId) {
      columnId = generateIdFromLabel(existingColumn?.label || `column_${index + 1}`);
    }
    
    newColumns[index] = { 
      ...existingColumn, 
      ...updatedColumn,
      id: columnId
    };
    
    setCurrentField({
      ...currentField,
      tableConfig: {
        ...currentField.tableConfig!,
        columns: newColumns
      }
    });
  };

  const removeTableColumn = (index: number) => {
    setCurrentField({
      ...currentField,
      tableConfig: {
        ...currentField.tableConfig!,
        columns: currentField.tableConfig?.columns?.filter((_, i) => i !== index) || []
      }
    });
  };

  const getFieldColor = (fieldType: Field['type']) => {
    const colors = {
      text: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)' },
      number: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.1)' },
      email: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)' },
      date: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.1)' },
      select: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.1)' },
      checkbox: { stroke: '#84cc16', fill: 'rgba(132, 204, 22, 0.1)' },
      textarea: { stroke: '#64748b', fill: 'rgba(100, 116, 139, 0.1)' },
      image: { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.1)' },
      list: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.1)' },
      table: { stroke: '#9333ea', fill: 'rgba(147, 51, 234, 0.1)' },
      group: { stroke: '#9333ea', fill: 'rgba(147, 51, 234, 0.1)' }
    };
    return colors[fieldType];
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const editField = (field: Field) => {
    setEditingField(field);
    setCurrentField(field);
    setShowFieldModal(true);
  };

  const addField = () => {
    const fieldId = generateIdFromLabel(currentField.label) || `field_${Date.now()}`;
    
    if (editingField) {
      setFields(fields.map(f => f.id === editingField.id ? { ...currentField, id: fieldId } : f));
      setEditingField(null);
    } else {
      const newField = { 
        ...currentField, 
        id: fieldId,
        order: fields.length,
        height: currentField.height || 40,
        visible: true
      };
      setFields([...fields, newField]);
    }
    setShowFieldModal(false);
    setCurrentField({
      id: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
      coordinates: null,
      page: 1,
      listConfig: {
        minItems: 1,
        maxItems: 10,
        columns: []
      },
      tableConfig: {
        rows: 1,
        columns: [],
        data: [],
        borderStyle: {
          borderWidth: '1',
          borderColor: '#000000',
          borderStyle: 'solid'
        }
      },
      groupConfig: {
        fields: [],
        additionalFields: []
      },
      style: {
        fontSize: '12',
        color: '#000000',
        fontFamily: 'Palatino, "Palatino Linotype", serif',
        fontWeight: 'normal',
        fontStyle: 'normal'
      },
      formula: '' // Reset formula
    });
  };

  const createGroup = () => {
    if (!groupName || selectedFields.length === 0) return;

    const fieldsToGroup = fields.filter(field => selectedFields.includes(field.id));
    const remainingFields = fields.filter(field => !selectedFields.includes(field.id));

    const newGroup: Field = {
      id: generateIdFromLabel(groupName),
      label: groupName,
      type: 'group',
      required: false,
      coordinates: null, // Groups don't have visual coordinates
      page: 1,
      order: remainingFields.length,
      height: 100,
      visible: true,
      groupConfig: {
        fields: fieldsToGroup,
        additionalFields: additionalFields
      },
      style: {
        fontSize: '12',
        color: '#000000',
        fontFamily: 'Palatino, "Palatino Linotype", serif',
        fontWeight: 'normal',
        fontStyle: 'normal'
      }
    };

    setFields([...remainingFields, newGroup]);
    setShowGroupModal(false);
    setSelectedFields([]);
    setGroupName('');
    setAdditionalFields([]);
  };

  const addAdditionalField = () => {
    const newField = {
      id: generateIdFromLabel(`additional_field_${additionalFields.length + 1}`),
      label: `Additional Field ${additionalFields.length + 1}`,
      type: 'text',
      required: false,
      options: []
    };
    setAdditionalFields([...additionalFields, newField]);
  };

  const updateAdditionalField = (index: number, updatedField: any) => {
    const newFields = [...additionalFields];
    newFields[index] = {
      ...newFields[index],
      ...updatedField,
      id: updatedField.label ? generateIdFromLabel(updatedField.label) : newFields[index].id
    };
    setAdditionalFields(newFields);
  };

  const removeAdditionalField = (index: number) => {
    setAdditionalFields(additionalFields.filter((_, i) => i !== index));
  };

  const addGroupField = () => {
    if (!currentField.groupConfig) return;

    const newField: Field = {
      id: generateIdFromLabel(`sub_field_${currentField.groupConfig.fields.length + 1}`),
      label: `Sub Field ${currentField.groupConfig.fields.length + 1}`,
      type: 'text',
      required: false,
      options: [],
      coordinates: null,
      page: 1,
      style: {
        fontSize: '12',
        color: '#000000',
        fontFamily: 'Palatino, "Palatino Linotype", serif',
        fontWeight: 'normal',
        fontStyle: 'normal'
      }
    };

    setCurrentField({
      ...currentField,
      groupConfig: {
        ...currentField.groupConfig,
        fields: [...currentField.groupConfig.fields, newField]
      }
    });
  };

  const updateGroupField = (index: number, updatedField: Partial<Field>) => {
    if (!currentField.groupConfig) return;

    const newFields = [...currentField.groupConfig.fields];
    newFields[index] = { 
      ...newFields[index], 
      ...updatedField,
      id: updatedField.label ? generateIdFromLabel(updatedField.label) : newFields[index].id
    };
    
    setCurrentField({
      ...currentField,
      groupConfig: {
        ...currentField.groupConfig,
        fields: newFields
      }
    });
  };

  const removeGroupField = (index: number) => {
    if (!currentField.groupConfig) return;

    setCurrentField({
      ...currentField,
      groupConfig: {
        ...currentField.groupConfig,
        fields: currentField.groupConfig.fields.filter((_, i) => i !== index)
      }
    });
  };

  const renderFieldPreview = (field: Field) => {
    const fieldHeight = field.height || 40;
    const isVisible = field.visible !== false;
    
    if (!isVisible && !showPreviewMode) return null;

    const fieldStyle = {
      minHeight: `${fieldHeight}px`,
      opacity: isVisible ? 1 : 0.5
    };

    // Calculate formula value for number fields
    let computedValue = previewValues[field.id] || '';
    if (field.formula && field.type === 'number') {
      computedValue = evaluateFormula(field.formula, field.id);
    }

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full p-2 border rounded"
            style={fieldStyle}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
            disabled={!isVisible}
          />
        );
      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              className={`w-full p-2 border rounded ${field.formula ? 'bg-blue-50 border-blue-300' : ''}`}
              style={fieldStyle}
              value={field.formula ? computedValue : (previewValues[field.id] || '')}
              onChange={(e) => !field.formula && setPreviewValues({
                ...previewValues,
                [field.id]: e.target.value
              })}
              disabled={!isVisible || !!field.formula}
              placeholder={field.formula ? 'Calculated' : 'Enter number'}
            />
            {field.formula && (
              <div className="text-xs text-blue-600 mt-1">
                📊 Formula: {field.formula}
              </div>
            )}
          </div>
        );
      case 'email':
        return (
          <input
            type="email"
            className="w-full p-2 border rounded"
            style={fieldStyle}
            placeholder="user@example.com"
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
            disabled={!isVisible}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full p-2 border rounded"
            style={fieldStyle}
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
            disabled={!isVisible}
          />
        );
      case 'select':
        return (
          <select
            className="w-full p-2 border rounded"
            style={fieldStyle}
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
            disabled={!isVisible}
          >
            <option value="">Select...</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2" style={fieldStyle}>
            <input
              type="checkbox"
              checked={previewValues[field.id] || false}
              onChange={(e) => setPreviewValues({
                ...previewValues,
                [field.id]: e.target.checked
              })}
              className="w-4 h-4"
              disabled={!isVisible}
            />
            <span className="text-sm text-gray-600">Yes/No</span>
          </div>
        );
      case 'textarea':
        return (
          <textarea
            className="w-full p-2 border rounded resize-none"
            style={{ ...fieldStyle, minHeight: `${Math.max(fieldHeight, 60)}px` }}
            rows={Math.max(3, Math.floor(fieldHeight / 20))}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
            disabled={!isVisible}
          />
        );
      case 'table':
        return (
          <div className="overflow-x-auto" style={fieldStyle}>
            <table className="w-full border-collapse">
              <tbody>
                {Array(field.tableConfig?.rows || 1).fill(0).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {field.tableConfig?.columns?.map((column, colIndex) => {
                      const cellKey = `${field.id}_${rowIndex}_${colIndex}`;
                      let cellValue = previewValues[cellKey] || '';
                      
                      // Calculate formula for number columns
                      if (column.type === 'number' && column.formula) {
                        try {
                          cellValue = evaluateFormula(column.formula, `${field.id}.${column.id}`, rowIndex);
                        } catch (error) {
                          cellValue = 'Error';
                        }
                      }
                      
                      return (
                        <td key={colIndex} className="p-2 border">
                          {column.type === 'number' ? (
                            <input
                              type="number"
                              className={`w-full p-1 border rounded text-center ${column.formula ? 'bg-blue-50 border-blue-300' : ''}`}
                              value={cellValue}
                              onChange={(e) => !column.formula && setPreviewValues({
                                ...previewValues,
                                [cellKey]: e.target.value
                              })}
                              disabled={!isVisible || !!column.formula}
                              placeholder={column.formula ? 'Calculated' : '0'}
                            />
                          ) : column.type === 'date' ? (
                            <input
                              type="date"
                              className="w-full p-1 border rounded text-center"
                              value={previewValues[cellKey] || ''}
                              onChange={(e) => setPreviewValues({
                                ...previewValues,
                                [cellKey]: e.target.value
                              })}
                              disabled={!isVisible}
                            />
                          ) : column.type === 'select' ? (
                            <select
                              className="w-full p-1 border rounded text-center"
                              value={previewValues[cellKey] || ''}
                              onChange={(e) => setPreviewValues({
                                ...previewValues,
                                [cellKey]: e.target.value
                              })}
                              disabled={!isVisible}
                            >
                              <option value="">Select...</option>
                              {column.options?.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="w-full p-1 border rounded text-center"
                              value={previewValues[cellKey] || ''}
                              onChange={(e) => setPreviewValues({
                                ...previewValues,
                                [cellKey]: e.target.value
                              })}
                              disabled={!isVisible}
                            />
                          )}
                          {column.formula && (
                            <div className="text-xs text-blue-600 mt-1 text-center">
                              📊 {column.formula}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              onClick={() => {
                const newField = {...field};
                if (newField.tableConfig) {
                  newField.tableConfig.rows += 1;
                  setFields(fields.map(f => f.id === field.id ? newField : f));
                }
              }}
              disabled={!isVisible}
            >
              <Plus size={16} className="inline mr-1" />
              Add Row
            </button>
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2" style={fieldStyle}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setPreviewValues({
                      ...previewValues,
                      [field.id]: event.target?.result
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id={`image-upload-${field.id}`}
              disabled={!isVisible}
            />
            <div className="border rounded p-4 text-center">
              {previewValues[field.id] ? (
                <div className="relative group">
                  <img
                    src={previewValues[field.id]}
                    alt="Preview"
                    className="max-h-32 mx-auto"
                    style={{ opacity: isVisible ? 1 : 0.5 }}
                  />
                  <button
                    onClick={() => setPreviewValues({
                      ...previewValues,
                      [field.id]: null
                    })}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={!isVisible}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`image-upload-${field.id}`}
                  className={`cursor-pointer text-blue-600 hover:text-blue-800 flex flex-col items-center ${!isVisible ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload size={24} />
                  <span className="text-sm mt-1">Upload Image</span>
                </label>
              )}
            </div>
          </div>
        );
      case 'group':
        const groupData = previewValues[field.id] || {};
        
        return (
          <div className="border rounded p-3 bg-gray-50" style={fieldStyle}>
            <div className="font-medium text-gray-800 mb-3">{field.label}</div>
            
            {/* Existing grouped fields (visible on PDF) */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-600 mb-2">Visual Fields (shown on PDF):</div>
              {field.groupConfig?.fields?.map((subField) => (
                <div key={subField.id} className="space-y-1 bg-white p-2 rounded border">
                  <label className="text-sm font-medium text-gray-600">
                    {subField.label}
                    {subField.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {subField.type === 'text' && (
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={groupData[subField.id] || ''}
                      onChange={(e) => setPreviewValues({
                        ...previewValues,
                        [field.id]: {
                          ...groupData,
                          [subField.id]: e.target.value
                        }
                      })}
                      disabled={!isVisible}
                    />
                  )}
                  
                  {subField.type === 'number' && (
                    <div className="relative">
                      <input
                        type="number"
                        className={`w-full p-2 border rounded ${subField.formula ? 'bg-blue-50 border-blue-300' : ''}`}
                        value={subField.formula 
                          ? evaluateFormula(subField.formula, `${field.id}.${subField.id}`)
                          : (groupData[subField.id] || '')
                        }
                        onChange={(e) => !subField.formula && setPreviewValues({
                          ...previewValues,
                          [field.id]: {
                            ...groupData,
                            [subField.id]: e.target.value
                          }
                        })}
                        disabled={!isVisible || !!subField.formula}
                        placeholder={subField.formula ? 'Calculated' : 'Enter number'}
                      />
                      {subField.formula && (
                        <div className="text-xs text-blue-600 mt-1">
                          📊 Formula: {subField.formula}
                        </div>
                      )}
                    </div>
                  )}

                  {subField.type === 'email' && (
                    <input
                      type="email"
                      className="w-full p-2 border rounded"
                      placeholder="user@example.com"
                      value={groupData[subField.id] || ''}
                      onChange={(e) => setPreviewValues({
                        ...previewValues,
                        [field.id]: {
                          ...groupData,
                          [subField.id]: e.target.value
                        }
                      })}
                      disabled={!isVisible}
                    />
                  )}

                  {subField.type === 'date' && (
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      value={groupData[subField.id] || ''}
                      onChange={(e) => setPreviewValues({
                        ...previewValues,
                        [field.id]: {
                          ...groupData,
                          [subField.id]: e.target.value
                        }
                      })}
                      disabled={!isVisible}
                    />
                  )}
                  
                  {subField.type === 'checkbox' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={groupData[subField.id] || false}
                        onChange={(e) => setPreviewValues({
                          ...previewValues,
                          [field.id]: {
                            ...groupData,
                            [subField.id]: e.target.checked
                          }
                        })}
                        className="w-4 h-4"
                        disabled={!isVisible}
                      />
                      <span className="text-sm text-gray-600">Yes/No</span>
                    </div>
                  )}
                  
                  {subField.type === 'select' && (
                    <select
                      className="w-full p-2 border rounded"
                      value={groupData[subField.id] || ''}
                      onChange={(e) => setPreviewValues({
                        ...previewValues,
                        [field.id]: {
                          ...groupData,
                          [subField.id]: e.target.value
                        }
                      })}
                      disabled={!isVisible}
                    >
                      <option value="">Select...</option>
                      {subField.options?.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  
                  {subField.type === 'textarea' && (
                    <textarea
                      className="w-full p-2 border rounded"
                      rows={2}
                      value={groupData[subField.id] || ''}
                      onChange={(e) => setPreviewValues({
                        ...previewValues,
                        [field.id]: {
                          ...groupData,
                          [subField.id]: e.target.value
                        }
                      })}
                      disabled={!isVisible}
                    />
                  )}

                  {subField.type === 'image' && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setPreviewValues({
                                ...previewValues,
                                [field.id]: {
                                  ...groupData,
                                  [subField.id]: event.target?.result
                                }
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id={`group-image-upload-${field.id}-${subField.id}`}
                        disabled={!isVisible}
                      />
                      <div className="border rounded p-4 text-center">
                        {groupData[subField.id] ? (
                          <div className="relative group">
                            <img
                              src={groupData[subField.id]}
                              alt="Preview"
                              className="max-h-32 mx-auto"
                              style={{ opacity: isVisible ? 1 : 0.5 }}
                            />
                            <button
                              onClick={() => setPreviewValues({
                                ...previewValues,
                                [field.id]: {
                                  ...groupData,
                                  [subField.id]: null
                                }
                              })}
                              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={!isVisible}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor={`group-image-upload-${field.id}-${subField.id}`}
                            className={`cursor-pointer text-blue-600 hover:text-blue-800 flex flex-col items-center ${!isVisible ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Upload size={24} />
                            <span className="text-sm mt-1">Upload Image</span>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Additional fields (non-visual) */}
            {field.groupConfig?.additionalFields && field.groupConfig.additionalFields.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm font-medium text-gray-600 mb-2">Additional Fields (data only):</div>
                {field.groupConfig.additionalFields.map((addField) => (
                  <div key={addField.id} className="space-y-1 bg-blue-50 p-2 rounded border">
                    <label className="text-sm font-medium text-gray-600">
                      {addField.label}
                      {addField.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {addField.type === 'text' && (
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={groupData[addField.id] || ''}
                        onChange={(e) => setPreviewValues({
                          ...previewValues,
                          [field.id]: {
                            ...groupData,
                            [addField.id]: e.target.value
                          }
                        })}
                        disabled={!isVisible}
                      />
                    )}
                    
                    {addField.type === 'number' && (
                      <div className="relative">
                        <input
                          type="number"
                          className={`w-full p-2 border rounded ${addField.formula ? 'bg-blue-50 border-blue-300' : ''}`}
                          value={addField.formula 
                            ? evaluateFormula(addField.formula, `${field.id}.${addField.id}`)
                            : (groupData[addField.id] || '')
                          }
                          onChange={(e) => !addField.formula && setPreviewValues({
                            ...previewValues,
                            [field.id]: {
                              ...groupData,
                              [addField.id]: e.target.value
                            }
                          })}
                          disabled={!isVisible || !!addField.formula}
                          placeholder={addField.formula ? 'Calculated' : 'Enter number'}
                        />
                        {addField.formula && (
                          <div className="text-xs text-blue-600 mt-1">
                            📊 Formula: {addField.formula}
                          </div>
                        )}
                      </div>
                    )}

                    {addField.type === 'email' && (
                      <input
                        type="email"
                        className="w-full p-2 border rounded"
                        placeholder="user@example.com"
                        value={groupData[addField.id] || ''}
                        onChange={(e) => setPreviewValues({
                          ...previewValues,
                          [field.id]: {
                            ...groupData,
                            [addField.id]: e.target.value
                          }
                        })}
                        disabled={!isVisible}
                      />
                    )}

                    {addField.type === 'date' && (
                      <input
                        type="date"
                        className="w-full p-2 border rounded"
                        value={groupData[addField.id] || ''}
                        onChange={(e) => setPreviewValues({
                          ...previewValues,
                          [field.id]: {
                            ...groupData,
                            [addField.id]: e.target.value
                          }
                        })}
                        disabled={!isVisible}
                      />
                    )}

                    {addField.type === 'textarea' && (
                      <textarea
                        className="w-full p-2 border rounded"
                        rows={2}
                        value={groupData[addField.id] || ''}
                        onChange={(e) => setPreviewValues({
                          ...previewValues,
                          [field.id]: {
                            ...groupData,
                            [addField.id]: e.target.value
                          }
                        })}
                        disabled={!isVisible}
                      />
                    )}
                    
                    {addField.type === 'select' && (
                      <select
                        className="w-full p-2 border rounded"
                        value={groupData[addField.id] || ''}
                        onChange={(e) => setPreviewValues({
                          ...previewValues,
                          [field.id]: {
                            ...groupData,
                            [addField.id]: e.target.value
                          }
                        })}
                        disabled={!isVisible}
                      >
                        <option value="">Select...</option>
                        {addField.options?.map((opt: string, i: number) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    
                    {addField.type === 'checkbox' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={groupData[addField.id] || false}
                          onChange={(e) => setPreviewValues({
                            ...previewValues,
                            [field.id]: {
                              ...groupData,
                              [addField.id]: e.target.checked
                            }
                          })}
                          className="w-4 h-4"
                          disabled={!isVisible}
                        />
                        <span className="text-sm text-gray-600">Yes/No</span>
                      </div>
                    )}

                    {addField.type === 'image' && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setPreviewValues({
                                  ...previewValues,
                                  [field.id]: {
                                    ...groupData,
                                    [addField.id]: event.target?.result
                                  }
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id={`additional-image-upload-${field.id}-${addField.id}`}
                          disabled={!isVisible}
                        />
                        <div className="border rounded p-4 text-center">
                          {groupData[addField.id] ? (
                            <div className="relative group">
                              <img
                                src={groupData[addField.id]}
                                alt="Preview"
                                className="max-h-32 mx-auto"
                                style={{ opacity: isVisible ? 1 : 0.5 }}
                              />
                              <button
                                onClick={() => setPreviewValues({
                                  ...previewValues,
                                  [field.id]: {
                                    ...groupData,
                                    [addField.id]: null
                                  }
                                })}
                                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={!isVisible}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <label
                              htmlFor={`additional-image-upload-${field.id}-${addField.id}`}
                              className={`cursor-pointer text-blue-600 hover:text-blue-800 flex flex-col items-center ${!isVisible ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Upload size={24} />
                              <span className="text-sm mt-1">Upload Image</span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return <div className="text-sm text-gray-500">Preview not available</div>;
    }
  };

  return (
    <>
      {/* Fields List */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Form Fields ({fields.length})</h3>
          {!showPreviewMode && fields.length > 1 && (
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 text-sm"
            >
              <Users size={16} />
              Create Group
            </button>
          )}
        </div>
        
        {fields.map((field, index) => (
          <div 
            key={field.id} 
            className={`mb-4 p-3 rounded-sm cursor-pointer last:mb-0 transition-all duration-200 ${
              draggedItem === field.id ? 'opacity-50' : ''
            } ${
              dragOverItem === field.id ? 'border-2 border-blue-500 bg-blue-50' : 'hover:bg-slate-400/10 border border-transparent'
            } ${
              field.visible === false ? 'bg-gray-100 opacity-75' : ''
            }`}
            draggable={!showPreviewMode}
            onDragStart={(e) => handleDragStart(e, field.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, field.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, field.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 flex-1">
                {!showPreviewMode && (
                  <GripVertical 
                    size={16} 
                    className="text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" 
                  />
                )}
                <span 
                  className="w-3 h-3 rounded-sm border-2 flex-shrink-0"
                  style={{ 
                    borderColor: getFieldColor(field.type).stroke,
                    backgroundColor: getFieldColor(field.type).fill
                  }}
                />
                <div className="flex-1">
                  <span className="font-medium text-sm">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                    {field.type === 'group' && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        GROUP ({field.groupConfig?.fields?.length || 0} visual + {field.groupConfig?.additionalFields?.length || 0} data)
                      </span>
                    )}
                    {field.visible === false && (
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        HIDDEN
                      </span>
                    )}
                  </span>
                  
                  {/* Field height control in edit mode */}
                  {!showPreviewMode && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Height:</label>
                        <input
                          type="number"
                          min="20"
                          max="500"
                          value={field.height || 40}
                          onChange={(e) => updateFieldHeight(field.id, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 text-xs border rounded"
                        />
                        <span className="text-xs text-gray-500">px</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {!showPreviewMode && (
                <div className="flex gap-1 items-center">
                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleFieldVisibility(field.id)}
                    className={`p-1 rounded ${field.visible === false ? 'text-gray-400 hover:text-gray-600' : 'text-blue-600 hover:text-blue-800'}`}
                    title={field.visible === false ? 'Show field' : 'Hide field'}
                  >
                    {field.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  
                  {/* Move up */}
                  <button
                    onClick={() => moveFieldUp(field.id)}
                    disabled={index === 0}
                    className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  
                  {/* Move down */}
                  <button
                    onClick={() => moveFieldDown(field.id)}
                    disabled={index === fields.length - 1}
                    className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  
                  {/* Edit */}
                  <button
                    onClick={() => editField(field)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Edit field"
                  >
                    <Edit size={16} />
                  </button>
                  
                  {/* Delete */}
                  <button
                    onClick={() => removeField(field.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete field"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            
            {showPreviewMode ? (
              <div className="mt-1">
                {renderFieldPreview(field)}
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                {field.type}
                {field.type === 'table' && ` (${field.tableConfig?.columns?.length || 0} columns)`}
                {field.type === 'group' && field.groupConfig && (
                  <div className="mt-1">
                    <div>Visual fields: {field.groupConfig.fields?.map(f => f.label).join(', ')}</div>
                    {field.groupConfig?.additionalFields && field.groupConfig.additionalFields.length > 0 && (
                      <div>Data fields: {field.groupConfig.additionalFields.map(f => f.label).join(', ')}</div>
                    )}
                  </div>
                )}
                <div className="mt-1">Height: {field.height || 40}px</div>
                {field.formula && (
                  <div className="mt-1 text-blue-600">Formula: {field.formula}</div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {fields.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No fields added yet. Click "Add Field" to start.
          </div>
        )}
      </div>

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Field Group</h3>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setSelectedFields([]);
                  setGroupName('');
                  setAdditionalFields([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Fields to Group (these will be visible on PDF)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {fields.filter(f => f.type !== 'group').map(field => (
                    <div key={field.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`field-${field.id}`}
                        checked={selectedFields.includes(field.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFields([...selectedFields, field.id]);
                          } else {
                            setSelectedFields(selectedFields.filter(id => id !== field.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`field-${field.id}`} className="flex items-center gap-2 cursor-pointer">
                        <span 
                          className="w-3 h-3 rounded-sm border-2"
                          style={{ 
                            borderColor: getFieldColor(field.type).stroke,
                            backgroundColor: getFieldColor(field.type).fill
                          }}
                        />
                        <span className="text-sm">{field.label} ({field.type})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Data Fields (not visible on PDF)
                  </label>
                  <button
                    onClick={addAdditionalField}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Plus size={16} />
                    Add Field
                  </button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {additionalFields.map((field, index) => (
                    <div key={index} className="border rounded p-3 bg-blue-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Additional Field {index + 1}</span>
                        <button
                          onClick={() => removeAdditionalField(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateAdditionalField(index, { label: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="Field label"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600">Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateAdditionalField(index, { type: e.target.value })}
                            className="w-full p-2 border rounded"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="date">Date</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="select">Select</option>
                            <option value="textarea">Textarea</option>
                            <option value="image">Image</option>
                          </select>
                        </div>
                      </div>
                      
                      {field.type === 'select' && (
                        <div className="mt-2">
                          <label className="text-xs text-gray-600">Options (comma-separated)</label>
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateAdditionalField(index, { 
                              options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt) 
                            })}
                            className="w-full p-2 border rounded"
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}

                      <div className="mt-2 flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateAdditionalField(index, { required: e.target.checked })}
                          className="mr-2"
                        />
                        <label className="text-xs text-gray-600">Required</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setSelectedFields([]);
                  setGroupName('');
                  setAdditionalFields([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!groupName || selectedFields.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Creation Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingField ? 'Edit' : 'Create'} Form Field
              </h3>
              <button
                onClick={() => setShowFieldModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected Area
                </label>
                <div className="p-2 bg-gray-100 rounded border text-sm">
                  {currentField.coordinates ?
                    `Rectangle: ${Math.round(currentField.coordinates.width)}x${Math.round(currentField.coordinates.height)}px` :
                    'No area selected'
                  }
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label
                </label>
                <input
                  type="text"
                  value={currentField.label}
                  onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter field label"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={currentField.type}
                  onChange={(e) => setCurrentField({ ...currentField, type: e.target.value as Field['type'] })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Checkbox (Yes/No)</option>
                  <option value="textarea">Textarea</option>
                  <option value="image">Image</option>
                  <option value="table">Table</option>
                  <option value="group">Group</option>
                </select>
              </div>

              {/* Formula Field for number and text types */}
              {(currentField.type === 'number' || currentField.type === 'text') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formula (Optional)
                  </label>
                  <div className="space-y-2">
                    <textarea
                      value={currentField.formula || ''}
                      onChange={(e) => setCurrentField({ ...currentField, formula: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter formula (e.g., field1 + field2 * 0.1)"
                      rows={3}
                    />
                    <div className="text-xs text-gray-500">
                      <p>Available fields:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fields
                          .filter(f => f.id && f.id !== generateIdFromLabel(currentField.label))
                          .map(field => (
                            <button
                              key={field.id}
                              type="button"
                              onClick={() => {
                                const currentFormula = currentField.formula || '';
                                setCurrentField({ 
                                  ...currentField, 
                                  formula: currentFormula + (currentFormula ? ' + ' : '') + field.id 
                                });
                              }}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                            >
                              {field.id}
                            </button>
                          ))}
                        {/* Table field references */}
                        {fields
                          .filter(f => f.type === 'table' && f.tableConfig?.columns)
                          .map(tableField => 
                            tableField.tableConfig?.columns?.map((col, colIndex) => 
                              Array.from({ length: tableField.tableConfig?.rows || 1 }, (_, rowIndex) => (
                                <button
                                  key={`${tableField.id}_${rowIndex}_${colIndex}`}
                                  type="button"
                                  onClick={() => {
                                    const fieldRef = `table_${rowIndex}_${colIndex}`;
                                    const currentFormula = currentField.formula || '';
                                    setCurrentField({ 
                                      ...currentField, 
                                      formula: currentFormula + (currentFormula ? ' + ' : '') + fieldRef 
                                    });
                                  }}
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                  title={`${col.label || `Column ${colIndex + 1}`} - Row ${rowIndex + 1}`}
                                >
                                  📊 table_{rowIndex}_{colIndex}
                                </button>
                              ))
                            )
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Group Configuration */}
              {currentField.type === 'group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Fields Configuration
                  </label>
                  <div className="space-y-3">
                    {currentField.groupConfig?.fields?.map((groupField, index) => (
                      <div key={index} className="border rounded p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Field {index + 1}</span>
                          <button
                            onClick={() => removeGroupField(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600">Label</label>
                            <input
                              type="text"
                              value={groupField.label}
                              onChange={(e) => updateGroupField(index, { label: e.target.value })}
                              className="w-full p-2 border rounded"
                              placeholder="Field label"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600">Type</label>
                            <select
                              value={groupField.type}
                              onChange={(e) => updateGroupField(index, { type: e.target.value as Field['type'] })}
                              className="w-full p-2 border rounded"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="email">Email</option>
                              <option value="date">Date</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="select">Select</option>
                              <option value="textarea">Textarea</option>
                              <option value="image">Image</option>
                            </select>
                          </div>
                        </div>

                        {groupField.type === 'select' && (
                          <div className="mt-2">
                            <label className="text-xs text-gray-600">Options (comma-separated)</label>
                            <input
                              type="text"
                              value={groupField.options?.join(', ') || ''}
                              onChange={(e) => updateGroupField(index, {
                                options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt)
                              })}
                              className="w-full p-2 border rounded"
                              placeholder="Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}

                        <div className="mt-2 flex items-center">
                          <input
                            type="checkbox"
                            checked={groupField.required}
                            onChange={(e) => updateGroupField(index, { required: e.target.checked })}
                            className="mr-2"
                          />
                          <label className="text-xs text-gray-600">Required</label>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addGroupField}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Plus size={16} />
                      Add Group Field
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={currentField.required}
                  onChange={(e) => setCurrentField({ ...currentField, required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="required" className="text-sm font-medium text-gray-700">
                  Required field
                </label>
              </div>

              {/* Style Settings */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Size
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="72"
                      value={currentField.style?.fontSize || '12'}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        style: {
                          fontSize: e.target.value,
                          color: currentField.style?.color ?? '#000000',
                          fontFamily: currentField.style?.fontFamily ?? 'Palatino, "Palatino Linotype", serif',
                          fontWeight: currentField.style?.fontWeight ?? 'normal',
                          fontStyle: currentField.style?.fontStyle ?? 'normal'
                        }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={currentField.style?.color || '#000000'}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        style: {
                          fontSize: String(currentField.style?.fontSize ?? '12'),
                          color: e.target.value,
                          fontFamily: currentField.style?.fontFamily ?? 'Palatino, "Palatino Linotype", serif',
                          fontWeight: currentField.style?.fontWeight ?? 'normal',
                          fontStyle: currentField.style?.fontStyle ?? 'normal',
                        }
                      })}
                      className="w-full p-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-[42px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Family
                    </label>
                    <select
                      value={currentField.style?.fontFamily || 'Palatino, "Palatino Linotype", serif'}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        style: {
                          fontSize: currentField.style?.fontSize ?? '12',
                          color: currentField.style?.color ?? '#000000',
                          fontFamily: e.target.value,
                          fontWeight: currentField.style?.fontWeight ?? 'normal',
                          fontStyle: currentField.style?.fontStyle ?? 'normal'
                        }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Palatino, &quot;Palatino Linotype&quot;, serif">Palatino</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Tahoma">Tahoma</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Impact">Impact</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={currentField.style?.fontWeight || 'normal'}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        style: {
                          fontSize: currentField.style?.fontSize ?? '12',
                          color: currentField.style?.color ?? '#000000',
                          fontFamily: currentField.style?.fontFamily ?? 'Palatino, "Palatino Linotype", serif',
                          fontWeight: e.target.value,
                          fontStyle: currentField.style?.fontStyle ?? 'normal'
                        }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Light</option>
                      <option value="100">Thin (100)</option>
                      <option value="300">Light (300)</option>
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra Bold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Style
                  </label>
                  <select
                    value={currentField.style?.fontStyle || 'normal'}
                    onChange={(e) => setCurrentField({
                      ...currentField,
                      style: {
                        fontSize: currentField.style?.fontSize ?? '12',
                        color: currentField.style?.color ?? '#000000',
                        fontFamily: currentField.style?.fontFamily ?? 'Palatino, "Palatino Linotype", serif',
                        fontWeight: currentField.style?.fontWeight ?? 'normal',
                        fontStyle: e.target.value
                      }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                    <option value="oblique">Oblique</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowFieldModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addField}
                disabled={!currentField.label}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {editingField ? 'Update' : 'Add'} Field
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};