import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Plus, Eye, Settings, Save } from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import { FieldManager } from './FieldManager';
import { generatePDFWithFields } from './pdfGenerator';
import Template1 from '/PR.pdf';
import Template2 from '/ABSTRACT-OF-PRICE-QUOTATION(QMS).pdf'
import axios from './../../../plugin/axios';
import Swal from 'sweetalert2';

function DocumentManage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [currentField, setCurrentField] = useState<Field>({
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
      fields: []
    },
    style: {
      fontSize: '12',
      color: '#000000',
      fontFamily: 'Palatino, "Palatino Linotype", serif',
      fontWeight: 'normal',
      fontStyle: 'normal'
    }
  });
  const [jsonTemplate, setJsonTemplate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [previewValues, setPreviewValues] = useState({});
  const [drawingMode, setDrawingMode] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const [templates, setTemplate] = useState<any[]>([]);

    const fetchTemplates = async () => {
      try {
        const response = await axios.get('/template/all/');
        setTemplate(response.data);
        console.log('Templates fetched:', response.data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

  useEffect(() => {
    // Fetch templates from the server
  

    fetchTemplates();
  }, []);

  const TEMPLATES = [
    { id: 'template1', name: 'Purchase Request Form 1', path: Template1 },
    { id: 'template2', name: 'ABSTRACT-OF-PRICE-QUOTATION(QMS) Form', path: Template2 }
  ];

  const removeRedocsPrefix = (filePath: string) => {
  if (filePath && filePath.startsWith('/redocs')) {
    return filePath.replace('/redocs', '');
  }
  return filePath;
};



  const handleTemplateSelect = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template.path);

  
      setDocumentName(template.name);
      fetch(template.path)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], template.name + '.pdf', { type: 'application/pdf' });
          setPdfFile(file);
          const url = URL.createObjectURL(file);
          setPdfUrl(url);
        });
    }
  };

  const handleServerTemplateSelect = async (templateId: string) => {
  if (!templateId) return;
  
  setIsLoadingTemplate(true);
  try {
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      // Set document name
      setDocumentName(template.name);
      
      // Clean the file path and construct the correct URL
      let pdfUrl = template.file;
      
      // Remove /redocs prefix if it exists
      if (pdfUrl.startsWith('/redocs')) {
        pdfUrl = pdfUrl.replace('/redocs', '');
      }
      
      // For files in the public folder, don't add the API URL
      if (pdfUrl.startsWith('/') && pdfUrl.includes('.pdf')) {
        // This is likely a static file in the public folder
        pdfUrl = pdfUrl; // Keep as is, browser will resolve relative to domain
      } else {
        // This is an API endpoint
        pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${pdfUrl}`;
      }
      
      console.log('Loading PDF from:', pdfUrl);
      
      // Load the PDF file
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to load PDF file: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }
      
      const pdfBlob = await pdfResponse.blob();
      const file = new File([pdfBlob], template.name + '.pdf', { type: 'application/pdf' });
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setSelectedTemplate(template.file);
      
      // Load the fields from the template - the structure is directly in template.body
      if (template.body && template.body.fields) {
        const mappedFields = template.body.fields.map(field => ({
          ...field,
          tableConfig: field.tableConfig || {
            rows: 1,
            columns: [],
            data: []
          },
          listConfig: field.listConfig || {
            minItems: 1,
            maxItems: 10,
            columns: []
          },
          groupConfig: field.groupConfig || {
            fields: []
          }
        }));
        
        setFields(mappedFields);
        
        // If there are schema values, set them as preview values
        if (template.body.schema) {
          const initialValues = {};
          Object.keys(template.body.schema).forEach(key => {
            const schemaField = template.body.schema[key];
            if (schemaField.type === 'checkbox') {
              initialValues[key] = false;
            } else {
              initialValues[key] = '';
            }
          });
          setPreviewValues(initialValues);
        }
      }
      
      await Swal.fire({
        icon: 'success',
        title: 'Template Loaded',
        text: `Template "${template.name}" has been loaded successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  } catch (error) {
    console.error('Error loading template:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Load Failed',
      text: `There was an error loading the template: ${error.message}`,
      showConfirmButton: true,
      confirmButtonText: 'OK',
    });
  } finally {
    setIsLoadingTemplate(false);
  }
};

  const saveTemplate = async () => {
    setIsSaving(true);
    
    try {
      const template = {
        document: {
          name: documentName || (pdfFile ? pdfFile.name : 'untitled.pdf'),
          documentUrl: removeRedocsPrefix(selectedTemplate) || (pdfFile ? URL.createObjectURL(pdfFile) : ''),
          created: new Date().toISOString()
        },
        fields: fields.map(field => {
          const baseField: any = {
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required,
            coordinates: field.coordinates,
            page: field.page,
            style: {
              fontSize: field.style?.fontSize || '12',
              color: field.style?.color || '#000000',
              fontFamily: field.style?.fontFamily || 'Palatino, "Palatino Linotype", serif',
              fontWeight: field.style?.fontWeight || 'normal',
              fontStyle: field.style?.fontStyle || 'normal'
            }
          };

          // Add type-specific properties
          if (field.type === 'select' && field.options) {
            baseField.options = field.options;
          }

          if (field.type === 'checkbox') {
            baseField.value = false;
          }

          if (field.type === 'table' && field.tableConfig) {
            baseField.tableConfig = {
              rows: field.tableConfig.rows,
              expandable: true,
              columns: field.tableConfig.columns.map(col => ({
                label: col.label,
                width: col.width,
                type: col.type || 'text'
              })),
              data: Array(field.tableConfig.rows).fill(
                Array(field.tableConfig.columns.length).fill('')
              ),
              _footer: "xxx nothing follows xxx"
            };
          }

          if (field.type === 'group' && field.groupConfig) {
            baseField.groupConfig = {
              fields: field.groupConfig.fields || [],
              additionalFields: field.groupConfig.additionalFields || []
            };
          }

          if (field.type === 'list' && field.listConfig) {
            baseField.listConfig = field.listConfig;
          }

          return baseField;
        }),
        schema: fields.reduce((acc: Record<string, any>, field) => {
          const schemaField: any = {
            type: field.type,
            required: field.required,
            label: field.label
          };

          if (field.type === 'table' && field.tableConfig) {
            schemaField.tableConfig = {
              ...field.tableConfig,
              _footer: "xxx nothing follows xxx"
            };
          }

          if (field.type === 'select' && field.options) {
            schemaField.options = field.options;
          }

          if (field.type === 'group' && field.groupConfig) {
            schemaField.groupConfig = {
              fields: field.groupConfig.fields || [],
              additionalFields: field.groupConfig.additionalFields || []
            };
          }

          if (field.type === 'list' && field.listConfig) {
            schemaField.listConfig = field.listConfig;
          }

          acc[field.id] = schemaField;
          return acc;
        }, {})
      };

      const response = await axios.post('/template/all/', { 
        "name": documentName, 
        "body": template,
        "file": selectedTemplate || (pdfFile ? URL.createObjectURL(pdfFile) : '') 
      });

      fetchTemplates(); // Refresh templates after saving

      await Swal.fire({
        icon: 'success',
        title: 'Template Saved',
        text: 'Your template has been saved successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
      
      // Refresh the templates list
      const templatesResponse = await axios.get('/template/all/');
      setTemplate(templatesResponse.data);
      
      setFields([]); // Clear fields after saving
      console.log('Fields saved successfully:', response.data);
    } catch (error) {
      console.error('Error saving fields:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'There was an error saving your template. Please try again.',
        showConfirmButton: true,
        confirmButtonText: 'OK',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateJsonTemplate = () => {
    const template = {
      document: {
        name: documentName || (pdfFile ? pdfFile.name : 'untitled.pdf'),
        documentUrl: selectedTemplate || (pdfFile ? URL.createObjectURL(pdfFile) : ''),
        created: new Date().toISOString()
      },
      fields: fields.map(field => {
        const baseField: any = {
          id: field.id,
          label: field.label,
          type: field.type,
          required: field.required,
          coordinates: field.coordinates,
          page: field.page,
          style: {
            fontSize: field.style?.fontSize || '12',
            color: field.style?.color || '#000000',
            fontFamily: field.style?.fontFamily || 'Palatino, "Palatino Linotype", serif',
            fontWeight: field.style?.fontWeight || 'normal',
            fontStyle: field.style?.fontStyle || 'normal'
          }
        };

        // Add type-specific properties
        if (field.type === 'select' && field.options) {
          baseField.options = field.options;
        }

        if (field.type === 'checkbox') {
          baseField.value = false;
        }

        if (field.type === 'table' && field.tableConfig) {
          baseField.tableConfig = {
            rows: field.tableConfig.rows,
            expandable: true,
            columns: field.tableConfig.columns.map(col => ({
              label: col.label,
              width: col.width,
              type: col.type || 'text'
            })),
            data: Array(field.tableConfig.rows).fill(
              Array(field.tableConfig.columns.length).fill('')
            ),
            _footer: "xxx nothing follows xxx"
          };
        }

        if (field.type === 'group' && field.groupConfig) {
          baseField.groupConfig = {
            fields: field.groupConfig.fields || [],
            additionalFields: field.groupConfig.additionalFields || []
          };
        }

        if (field.type === 'list' && field.listConfig) {
          baseField.listConfig = field.listConfig;
        }

        return baseField;
      }),
      schema: fields.reduce((acc: Record<string, any>, field) => {
        const schemaField: any = {
          type: field.type,
          required: field.required,
          label: field.label
        };

        if (field.type === 'table' && field.tableConfig) {
          schemaField.tableConfig = {
            ...field.tableConfig,
            _footer: "xxx nothing follows xxx"
          };
        }

        if (field.type === 'select' && field.options) {
          schemaField.options = field.options;
        }

        if (field.type === 'group' && field.groupConfig) {
          schemaField.groupConfig = {
            fields: field.groupConfig.fields || [],
            additionalFields: field.groupConfig.additionalFields || []
          };
        }

        if (field.type === 'list' && field.listConfig) {
          schemaField.listConfig = field.listConfig;
        }

        acc[field.id] = schemaField;
        return acc;
      }, {})
    };




    const jsonString = JSON.stringify(template, null, 2);
    setJsonTemplate(jsonString);
  };

  const downloadTemplate = () => {
    const blob = new Blob([jsonTemplate], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfFile ? pdfFile.name.replace('.pdf', '') : 'template'}_fields.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFilledPDF = async () => {
    if (!pdfUrl || !fields.length) {
      alert('Please upload a PDF and add some fields first');
      return;
    }

    try {
      const pdfDoc = await generatePDFWithFields(pdfUrl, fields, previewValues);
      const pdfBytes = await pdfDoc.save();
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdfFile ? pdfFile.name.replace('.pdf', '_filled.pdf') : 'filled_document.pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const importTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const template = JSON.parse(event.target.result);
            setFields(template.fields.map(field => ({
              ...field,
              tableConfig: field.tableConfig || {
                rows: 1,
                columns: [],
                data: []
              },
              listConfig: {
                minItems: 1,
                maxItems: 10,
                columns: []
              }
            })));
            if (template.values) {
              setPreviewValues(template.values);
            }
          } catch (error) {
            console.error('Error parsing JSON template:', error);
            alert('Invalid JSON template file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey) {
        if (e.key === 'e') {
          e.preventDefault();
          setDrawingMode(true);
        } else if (e.key === 'q') {
          e.preventDefault();
          setShowPreviewMode(!showPreviewMode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPreviewMode]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">

          <div className=' flex justify-between '>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">PDF Document Manager</h1>

            <button
              onClick={saveTemplate}
              disabled={fields.length === 0 || isSaving}
              className="flex items-center h-full justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Document
                </>
              )}
            </button>

          </div>
          

          

          {/* File Upload Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <select
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                defaultValue=""
              >
                <option value="" disabled>Select Local Template</option>
                {TEMPLATES.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>

              <select
                onChange={(e) => handleServerTemplateSelect(e.target.value)}
                disabled={isLoadingTemplate}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"
                defaultValue=""
              >
                <option value="" disabled>
                  {isLoadingTemplate ? 'Loading Templates...' : 'Select Server Template'}
                </option>
                {templates.map(template => (
                  <option key={template.id} value={template.id.toString()}>
                    {template.name}
                  </option>
                ))}
              </select>

              {/* Document Name Input */}
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px]"
              />

              <button
                onClick={importTemplate}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Upload size={20} />
                Import Template
              </button>

              <button
                onClick={() => setDrawingMode(true)}
                disabled={!pdfUrl}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={20} />
                Add Field
              </button>

              <button
                onClick={() => setShowPreviewMode(!showPreviewMode)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
              >
                <Eye size={16} />
                {showPreviewMode ? 'Edit Mode' : 'Preview Mode'}
              </button>

              {pdfFile && (
                <span className="text-sm text-gray-600">
                  {pdfFile.name}
                </span>
              )}

              {drawingMode && (
                <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg">
                  <Settings size={16} />
                  <span className="text-sm font-medium">Drawing Mode Active</span>
                </div>
              )}

              {isLoadingTemplate && (
                <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div>
                  <span className="text-sm font-medium">Loading Template...</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Viewer */}
            <div className="lg:col-span-2">
              <PDFViewer
                pdfUrl={pdfUrl}
                fields={fields}
                setFields={setFields}
                currentField={currentField}
                setCurrentField={setCurrentField}
                showFieldModal={showFieldModal}
                setShowFieldModal={setShowFieldModal}
                drawingMode={drawingMode}
                setDrawingMode={setDrawingMode}
                showPreviewMode={showPreviewMode}
                previewValues={previewValues}
                setPreviewValues={setPreviewValues}
              />
            </div>

            {/* Field Management */}
            <div className="space-y-6">
              <FieldManager
                fields={fields}
                setFields={setFields}
                showPreviewMode={showPreviewMode}
                previewValues={previewValues}
                setPreviewValues={setPreviewValues}
                currentField={currentField}
                setCurrentField={setCurrentField}
                showFieldModal={showFieldModal}
                setShowFieldModal={setShowFieldModal}
                editingField={editingField}
                setEditingField={setEditingField}
              />
              
              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={generateJsonTemplate}
                  disabled={fields.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={20} />
                  Generate Template
                </button>

                <button
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={!jsonTemplate}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye size={20} />
                  {showPreview ? 'Hide' : 'Show'} JSON
                </button>

                <button
                  onClick={downloadTemplate}
                  disabled={!jsonTemplate}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Download size={20} />
                  Download Template
                </button>

                <button
                  onClick={downloadFilledPDF}
                  disabled={!pdfUrl || fields.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Download size={20} />
                  Download Filled PDF
                </button>
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          {showPreview && jsonTemplate && (
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">JSON Template</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {jsonTemplate}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentManage;