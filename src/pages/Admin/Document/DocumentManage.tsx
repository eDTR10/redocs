import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Plus, Eye, Settings, Save } from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import { FieldManager } from './FieldManager';
import { generatePDFWithFields } from './pdfGenerator';
import Template1 from '/PR.pdf';

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

  const TEMPLATES = [
    { id: 'template1', name: 'Purchase Request Form 1', path: Template1 },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
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
          baseField.groupConfig = field.groupConfig;
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
          schemaField.groupConfig = field.groupConfig;
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">PDF Document Manager</h1>

          {/* File Upload Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <select
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                defaultValue=""
              >
                <option value="" disabled>Select Template</option>
                {TEMPLATES.map(template => (
                  <option key={template.id} value={template.id}>
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