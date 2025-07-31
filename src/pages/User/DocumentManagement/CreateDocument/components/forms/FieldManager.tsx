import React, { useState } from 'react';
import { Trash2, Edit, Plus, Upload, X, File, Pen, Users, Check } from 'lucide-react';
import { evaluate } from 'mathjs';

// Add to your Field interface
export interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'table' | 'list' | 'textarea' | 'email' | 'image' | 'group' | 'signature';
  required: boolean;
  options?: string[];
  coordinates: { x: number; y: number; width: number; height: number } | null;
  page: number;
  formula?: string; // Add formula property for calculated fields
  listConfig?: {
    minItems: number;
    maxItems: number;
    columns: any[];
  };
  tableConfig?: {
    rows: number;
    columns: any[];
    data: any[];
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

// Formula evaluation function with circular reference protection
const evaluateFormula = (formula: string, fields: Field[], previewValues: Record<string, any>, evaluating = new Set<string>()): number => {
  if (!formula.trim()) return 0;
  
  try {
    let processedFormula = formula;
    
    // Replace field references with their values
    fields.forEach(field => {
      if (!field.id) return;
      
      // Check for circular reference
      if (evaluating.has(field.id)) {
        console.warn(`Circular reference detected for field: ${field.id}`);
        return;
      }
      
      const fieldRegex = new RegExp(`\\b${field.id}\\b`, 'g');
      if (processedFormula.match(fieldRegex)) {
        let fieldValue = 0;
        
        if (field.formula && field.formula.trim()) {
          // This is a calculated field, evaluate its formula first
          evaluating.add(field.id);
          fieldValue = evaluateFormula(field.formula, fields, previewValues, evaluating);
          evaluating.delete(field.id);
        } else {
          // Regular field, get its value
          fieldValue = parseFloat(previewValues[field.id] || '0') || 0;
        }
        
        processedFormula = processedFormula.replace(fieldRegex, fieldValue.toString());
      }
    });
    
    // Handle table field references (table_row_col format)
    const tableFieldRegex = /table_(\d+)_(\d+)/g;
    processedFormula = processedFormula.replace(tableFieldRegex, (match, row, col) => {
      const tableField = fields.find(f => f.type === 'table');
      if (tableField && tableField.tableConfig) {
        const rowIndex = parseInt(row);
        const colIndex = parseInt(col);
        const cellValue = tableField.tableConfig.data?.[rowIndex]?.[colIndex];
        
        // Check if this cell has a formula
        const column = tableField.tableConfig.columns?.[colIndex];
        if (column && column.formula) {
          // Evaluate the cell formula
          const cellFormula = column.formula.replace(/row/g, rowIndex.toString());
          try {
            return evaluate(cellFormula).toString();
          } catch (e) {
            console.warn(`Error evaluating cell formula: ${e}`);
            return '0';
          }
        }
        
        return (parseFloat(cellValue) || 0).toString();
      }
      return '0';
    });
    
    const result = evaluate(processedFormula);
    return typeof result === 'number' ? result : 0;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return 0;
  }
};

// Function to update calculated fields
const updateCalculatedFields = (currentValues: Record<string, any>, allFields: Field[]): Record<string, any> => {
  const updatedValues = { ...currentValues };
  
  // Find all fields with formulas and update their values
  allFields.forEach(field => {
    if (field.formula && field.formula.trim() && field.id) {
      const calculatedValue = evaluateFormula(field.formula, allFields, updatedValues);
      updatedValues[field.id] = calculatedValue;
    }
  });
  
  return updatedValues;
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
      group: { stroke: '#9333ea', fill: 'rgba(147, 51, 234, 0.1)' },
      signature: { stroke: '#0ea5e9', fill: 'rgba(14, 165, 233, 0.1)' } // Added signature type
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
      setFields([...fields, { ...currentField, id: fieldId }]);
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
        data: []
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
      }
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
    const newField: Field = {
      id: generateIdFromLabel(`sub_field_${(currentField.groupConfig?.fields?.length ?? 0) + 1}`),
      label: `Sub Field ${(currentField.groupConfig?.fields?.length ?? 0) + 1}`,
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
        ...(currentField.groupConfig ?? { fields: [], additionalFields: [] }),
        fields: [...(currentField.groupConfig?.fields ?? []), newField]
      }
    });
  };

  const updateGroupField = (index: number, updatedField: Partial<Field>) => {
    const newFields = [...(currentField.groupConfig?.fields ?? [])];
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
    setCurrentField({
      ...currentField,
      groupConfig: {
        ...currentField.groupConfig,
        fields: (currentField.groupConfig?.fields ?? []).filter((_, i) => i !== index)
      }
    });
  };

  const renderFieldPreview = (field: Field) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition"
            placeholder={`Enter ${field.label}`}
            value={field.formula ? evaluateFormula(field.formula, fields, previewValues).toString() : (previewValues[field.id] || '')}
            onChange={(e) => {
              if (!field.formula) {
                const updatedValues = updateCalculatedFields({
                  ...previewValues,
                  [field.id]: e.target.value
                }, fields);
                setPreviewValues(updatedValues);
              }
            }}
            readOnly={!!field.formula}
            style={field.formula ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition"
            value={field.formula ? evaluateFormula(field.formula, fields, previewValues) : (previewValues[field.id] || '')}
            onChange={(e) => {
              if (!field.formula) {
                const updatedValues = updateCalculatedFields({
                  ...previewValues,
                  [field.id]: e.target.value
                }, fields);
                setPreviewValues(updatedValues);
              }
            }}
            readOnly={!!field.formula}
            style={field.formula ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition"
            placeholder="user@example.com"
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition"
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          />
        );
      case 'select':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition"
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          >
            <option value="">Select...</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={previewValues[field.id] || false}
              onChange={(e) => setPreviewValues({
                ...previewValues,
                [field.id]: e.target.checked
              })}
              className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition"
            />
            <span className="text-sm text-gray-700 font-medium">Yes/No</span>
          </div>
        );
      case 'textarea':
        return (
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition"
            rows={3}
            placeholder={`Enter ${field.label}`}
            value={previewValues[field.id] || ''}
            onChange={(e) => setPreviewValues({
              ...previewValues,
              [field.id]: e.target.value
            })}
          />
        );
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {field.tableConfig && Array(field.tableConfig.rows).fill(0).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {field.tableConfig?.columns.map((col, colIndex) => (
                      <td key={colIndex} className="p-2 border">
                        <input
                          type="text"
                          className="w-full p-1 border rounded text-center"
                          value={previewValues[`${field.id}_${rowIndex}_${colIndex}`] || ''}
                          onChange={(e) => setPreviewValues({
                            ...previewValues,
                            [`${field.id}_${rowIndex}_${colIndex}`]: e.target.value
                          })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {field.tableConfig && (
              <button
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  const newField = { ...field };
                  newField.tableConfig = {
                    ...newField.tableConfig,
                    rows: (newField.tableConfig?.rows ?? 0) + 1,
                    columns: newField.tableConfig?.columns ?? [],
                    data: newField.tableConfig?.data ?? []
                  };
                  setFields(fields.map(f => f.id === field.id ? newField : f));
                }}
              >
                <Plus size={16} className="inline mr-1" />
                Add Row
              </button>
            )}
          </div>
        );
      case 'image':
        return (
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
                      [field.id]: event.target?.result
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id={`image-upload-${field.id}`}
            />
            <div className="border rounded p-4 text-center">
              {previewValues[field.id] ? (
                <div className="relative group">
                  <img
                    src={previewValues[field.id]}
                    alt="Preview"
                    className="max-h-32 mx-auto"
                  />
                  <button
                    onClick={() => setPreviewValues({
                      ...previewValues,
                      [field.id]: null
                    })}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`image-upload-${field.id}`}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 flex flex-col items-center"
                >
                  <Upload size={24} />
                  <span className="text-sm mt-1">Upload Image</span>
                </label>
              )}
            </div>
          </div>
        );
      case 'signature':
        return (
          <div className="border rounded p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-800">Signature Details</h4>
              <button
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                onClick={() => {
                  // Handle signature capture
                  const canvas = document.createElement('canvas');
                  canvas.width = 300;
                  canvas.height = 150;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.fillStyle = '#f9fafb';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = '#4b5563';
                    ctx.lineWidth = 2;
                    ctx.font = '14px Arial';
                    ctx.fillStyle = '#4b5563';
                    ctx.textAlign = 'center';
                    ctx.fillText('Click to sign here', canvas.width / 2, canvas.height / 2);
                  }

                  const newSignature = {
                    ...(previewValues[field.id] || {}),
                    img: canvas.toDataURL()
                  };

                  setPreviewValues({
                    ...previewValues,
                    [field.id]: newSignature
                  });
                }}
              >
                <Pen size={14} />
                <span>Sign</span>
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Full Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={(previewValues[field.id]?.name || '')}
                  onChange={(e) => {
                    setPreviewValues({
                      ...previewValues,
                      [field.id]: {
                        ...(previewValues[field.id] || {}),
                        name: e.target.value
                      }
                    });
                  }}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1 block">ID / Position</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={(previewValues[field.id]?.id || '')}
                  onChange={(e) => {
                    setPreviewValues({
                      ...previewValues,
                      [field.id]: {
                        ...(previewValues[field.id] || {}),
                        id: e.target.value
                      }
                    });
                  }}
                  placeholder="Enter your ID or position"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1 block">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={(previewValues[field.id]?.status || '')}
                  onChange={(e) => {
                    setPreviewValues({
                      ...previewValues,
                      [field.id]: {
                        ...(previewValues[field.id] || {}),
                        status: e.target.value
                      }
                    });
                  }}
                >
                  <option value="">Select status...</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                  <option value="For Review">For Review</option>
                </select>
              </div>

              {previewValues[field.id]?.img && (
                <div className="relative">
                  <img
                    src={previewValues[field.id].img}
                    alt="Signature"
                    className="border rounded w-full max-h-24 object-contain bg-white"
                  />
                  <button
                    onClick={() => {
                      const newValue = { ...previewValues[field.id] };
                      delete newValue.img;
                      setPreviewValues({
                        ...previewValues,
                        [field.id]: newValue
                      });
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'group':
        const groupData = previewValues[field.id] || {};

        return (
          <div className="border rounded p-3 bg-gray-50">
            <div className="font-medium text-gray-800 mb-3">{field.label}</div>

            {/* Existing grouped fields (visible on PDF) */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-600 mb-2">Visual Fields (shown on PDF):</div>
              {field.groupConfig?.fields?.map((subField, index) => (
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
                    />
                  )}

                  {subField.type === 'number' && (
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={groupData[subField.id] || ''}
                      onChange={(e) => setPreviewValues({
                        ...previewValues,
                        [field.id]: {
                          ...groupData,
                          [subField.id]: e.target.value
                        }
                      })}
                    />
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
                      />
                      <div className="border rounded p-4 text-center">
                        {groupData[subField.id] ? (
                          <div className="relative group">
                            <img
                              src={groupData[subField.id]}
                              alt="Preview"
                              className="max-h-32 mx-auto"
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
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor={`group-image-upload-${field.id}-${subField.id}`}
                            className="cursor-pointer text-blue-600 hover:text-blue-800 flex flex-col items-center"
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
            {(field.groupConfig?.additionalFields?.length ?? 0) > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm font-medium text-gray-600 mb-2">Additional Fields (data only):</div>
                {field.groupConfig?.additionalFields?.map((addField, index) => (
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
                      />
                    )}

                    {addField.type === 'number' && (
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={groupData[addField.id] || ''}
                        onChange={(e) => setPreviewValues({
                          ...previewValues,
                          [field.id]: {
                            ...groupData,
                            [addField.id]: e.target.value
                          }
                        })}
                      />
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
                      >
                        <option value="">Select...</option>
                        {addField.options?.map((opt: any, i: any) => (
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
                        />
                        <div className="border rounded p-4 text-center">
                          {groupData[addField.id] ? (
                            <div className="relative group">
                              <img
                                src={groupData[addField.id]}
                                alt="Preview"
                                className="max-h-32 mx-auto"
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
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <label
                              htmlFor={`additional-image-upload-${field.id}-${addField.id}`}
                              className="cursor-pointer text-blue-600 hover:text-blue-800 flex flex-col items-center"
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
        
        {fields.map(field => (
          <div key={field.id} className="mb-4 hover:bg-slate-400/10 p-3 rounded-sm cursor-pointer last:mb-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm border-2"
                  style={{
                    borderColor: getFieldColor(field.type).stroke,
                    backgroundColor: getFieldColor(field.type).fill
                  }}
                />
                <span className="font-medium text-sm">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {field.type === 'group' && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      GROUP ({field.groupConfig?.fields?.length || 0} visual + {field.groupConfig?.additionalFields?.length || 0} data)
                    </span>
                  )}
                </span>
              </div>
              {!showPreviewMode && (
                <div className="flex gap-2">
                  <button
                    onClick={() => editField(field)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => removeField(field.id)}
                    className="text-red-600 hover:text-red-800"
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
                    {(field.groupConfig?.additionalFields?.length ?? 0) > 0 && (
                      <div>Data fields: {field.groupConfig?.additionalFields?.map(f => f.label).join(', ')}</div>
                    )}
                  </div>
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