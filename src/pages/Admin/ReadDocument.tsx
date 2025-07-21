import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Eye, FileText, CheckCircle } from 'lucide-react';

// Type definitions
interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'checkbox' | 'textarea' | 'image';
  required: boolean;
  options?: string[];
  coordinates: Coordinates | null;
  page: number;
}

interface JSONTemplate {
  document?: {
    name?: string;
    version?: string;
    created?: string;
  };
  fields: Field[];
}

interface PDFLib {
  getDocument: (url: string) => { promise: Promise<any> };
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

interface PDFLibrary {
  PDFDocument: any;
  rgb: (r: number, g: number, b: number) => any;
}

declare global {
  interface Window {
    pdfjsLib?: PDFLib;
    PDFLib?: PDFLibrary;
  }
}

function FormFiller() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [jsonTemplate, setJsonTemplate] = useState<JSONTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [imageFiles, setImageFiles] = useState<Record<string, File>>({}); // Store actual image files
  const [showPreview, setShowPreview] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [pdfScale, setPdfScale] = useState(1.5); // Store the scale factor
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // PDF.js and PDF-lib setup
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
      };
      document.head.appendChild(script);
    }

    // Load PDF-lib for PDF modification
    if (typeof window !== 'undefined' && !window.PDFLib) {
      const pdfLibScript = document.createElement('script');
      pdfLibScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
      document.head.appendChild(pdfLibScript);
    }
  }, []);

  // Validate form whenever formData changes
  useEffect(() => {
    if (jsonTemplate) {
      validateForm();
    }
  }, [formData, jsonTemplate]);

  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      if (jsonTemplate) {
        renderPDF(url);
      }
    }
  };

  const handleJSONUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target?.result || typeof e.target.result !== 'string') {
            throw new Error('Invalid file content');
          }
          const template: JSONTemplate = JSON.parse(e.target.result);
          setJsonTemplate(template);

          // Initialize form data
          const initialData: Record<string, any> = {};
          template.fields.forEach((field: Field) => {
            if (field.type === 'checkbox') {
              initialData[field.id] = [];
            } else {
              initialData[field.id] = '';
            }
          });
          setFormData(initialData);

          if (pdfUrl) {
            renderPDF(pdfUrl);
          }
        } catch (error) {
          alert('Invalid JSON template file');
        }
      };
      reader.readAsText(file);
    }
  };

  const renderPDF = async (url: string) => {
    if (!window.pdfjsLib) return;

    try {
      const pdf = await window.pdfjsLib.getDocument(url).promise;
      const page = await pdf.getPage(1);
      const scale = 1.5;
      setPdfScale(scale); // Store the scale for coordinate conversion
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (!canvas || !overlayCanvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      overlayCanvas.height = viewport.height;
      overlayCanvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      drawFormOverlay();
    } catch (error) {
      console.error('Error rendering PDF:', error);
    }
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
      image: { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.1)' }
    };
    return colors[fieldType];
  };

  const drawFormOverlay = () => {
    if (!jsonTemplate || !overlayCanvasRef.current || !canvasRef.current) return;

    const overlayCanvas = overlayCanvasRef.current;
    const canvas = canvasRef.current;

    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    jsonTemplate.fields.forEach(field => {
      if (field.coordinates) {
        const colors = getFieldColor(field.type);
        const hasError = validationErrors[field.id];
        const hasValue = formData[field.id] &&
          (Array.isArray(formData[field.id]) ? formData[field.id].length > 0 : formData[field.id].toString().trim() !== '');

        // Use error color if there's an error, success color if filled, default color otherwise
        let strokeColor = colors.stroke;
        let fillColor = colors.fill;

        if (hasError) {
          strokeColor = '#ef4444';
          fillColor = 'rgba(239, 68, 68, 0.1)';
        } else if (hasValue) {
          strokeColor = '#10b981';
          fillColor = 'rgba(16, 185, 129, 0.1)';
        }

        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = fillColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        ctx.fillRect(field.coordinates.x, field.coordinates.y, field.coordinates.width, field.coordinates.height);
        ctx.strokeRect(field.coordinates.x, field.coordinates.y, field.coordinates.width, field.coordinates.height);

        // Draw filled value or placeholder
        ctx.fillStyle = hasValue ? '#1f2937' : '#6b7280';
        ctx.font = '12px Arial';

        let displayText = '';
        const value = formData[field.id];

        if (hasValue) {
          if (field.type === 'checkbox' && Array.isArray(value)) {
            displayText = value.join(', ');
          } else if (field.type === 'image' && value) {
            displayText = '🖼️ Image uploaded';
          } else {
            displayText = value.toString();
          }
        } else {
          // Show placeholder
          switch (field.type) {
            case 'text':
              displayText = 'Enter text...';
              break;
            case 'number':
              displayText = 'Enter number...';
              break;
            case 'email':
              displayText = 'Enter email...';
              break;
            case 'date':
              displayText = 'Select date...';
              break;
            case 'select':
              displayText = 'Select option...';
              break;
            case 'checkbox':
              displayText = 'Select options...';
              break;
            case 'textarea':
              displayText = 'Enter long text...';
              break;
            case 'image':
              displayText = 'Upload image...';
              break;
          }
        }

        // Truncate text if too long
        if (displayText.length > 20) {
          displayText = displayText.substring(0, 20) + '...';
        }

        const textY = field.coordinates.y + field.coordinates.height / 2 + 5;
        ctx.fillText(displayText, field.coordinates.x + 5, textY);

        // Draw required indicator
        if (field.required) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('*', field.coordinates.x + field.coordinates.width - 15, field.coordinates.y + 15);
        }

        // Draw validation check/error icon
        if (hasError) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 14px Arial';
          ctx.fillText('⚠', field.coordinates.x + field.coordinates.width - 30, field.coordinates.y + 15);
        } else if (hasValue) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 14px Arial';
          ctx.fillText('✓', field.coordinates.x + field.coordinates.width - 30, field.coordinates.y + 15);
        }
      }
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (jsonTemplate) {
      jsonTemplate.fields.forEach(field => {
        if (field.required) {
          const value = formData[field.id];
          if (!value || (Array.isArray(value) && value.length === 0) || value.toString().trim() === '') {
            errors[field.id] = 'This field is required';
            isValid = false;
          }
        }

        // Type-specific validation
        if (formData[field.id] && field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData[field.id])) {
            errors[field.id] = 'Please enter a valid email';
            isValid = false;
          }
        }

        if (formData[field.id] && field.type === 'number') {
          if (isNaN(formData[field.id]) || formData[field.id] === '') {
            errors[field.id] = 'Please enter a valid number';
            isValid = false;
          }
        }
      });
    }

    setValidationErrors(errors);
    setIsFormValid(isValid);
    drawFormOverlay();
  };

  const updateFormData = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = prev[fieldId] || [];
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, option]
        };
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter((val: string) => val !== option)
        };
      }
    });
  };

  const handleImageUpload = (fieldId: string, file: File) => {
    if (file) {
      setImageFiles(prev => ({
        ...prev,
        [fieldId]: file
      }));
      updateFormData(fieldId, file.name);
    }
  };

  const generateFilledPDF = async () => {
    if (!pdfFile || !jsonTemplate || !isFormValid || !window.PDFLib) return;

    try {
      // Read the original PDF file
      const arrayBuffer = await pdfFile.arrayBuffer();

      // Create PDF document using PDF-lib
      const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height } = firstPage.getSize();

      // Add form data to PDF
      for (const field of jsonTemplate.fields) {
        if (field.coordinates && formData[field.id]) {
          const value = formData[field.id];

          // Convert coordinates from canvas to PDF coordinate system
          // Canvas coordinates are scaled and use top-left origin
          // PDF coordinates use bottom-left origin and are in points
          const canvasX = field.coordinates.x;
          const canvasY = field.coordinates.y;
          const canvasWidth = field.coordinates.width;
          const canvasHeight = field.coordinates.height;

          // Convert from canvas coordinates to PDF coordinates
          const pdfX = canvasX / pdfScale;
          const pdfY = height - (canvasY / pdfScale) - (canvasHeight / pdfScale);
          const pdfWidth = canvasWidth / pdfScale;
          const pdfHeight = canvasHeight / pdfScale;

          if (field.type === 'image' && imageFiles[field.id]) {
            try {
              // Handle image embedding
              const imageFile = imageFiles[field.id];
              const imageArrayBuffer = await imageFile.arrayBuffer();

              let image;
              if (imageFile.type === 'image/png') {
                image = await pdfDoc.embedPng(imageArrayBuffer);
              } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
                image = await pdfDoc.embedJpg(imageArrayBuffer);
              } else {
                // If unsupported format, just show filename
                const fontSize = Math.min(12, pdfHeight / 2);
                firstPage.drawText(`[Image: ${imageFile.name}]`, {
                  x: pdfX + 5,
                  y: pdfY + (pdfHeight / 2) - (fontSize / 2),
                  size: fontSize,
                  color: window.PDFLib.rgb(0, 0, 0),
                });
                continue;
              }

              // Calculate image dimensions to fit within field
              const imageAspectRatio = image.width / image.height;
              const fieldAspectRatio = pdfWidth / pdfHeight;

              let imageWidth, imageHeight;
              if (imageAspectRatio > fieldAspectRatio) {
                // Image is wider than field
                imageWidth = pdfWidth - 10; // Leave some margin
                imageHeight = imageWidth / imageAspectRatio;
              } else {
                // Image is taller than field
                imageHeight = pdfHeight - 10; // Leave some margin
                imageWidth = imageHeight * imageAspectRatio;
              }

              // Center the image in the field
              const imageX = pdfX + (pdfWidth - imageWidth) / 2;
              const imageY = pdfY + (pdfHeight - imageHeight) / 2;

              firstPage.drawImage(image, {
                x: imageX,
                y: imageY,
                width: imageWidth,
                height: imageHeight,
              });

            } catch (imageError) {
              console.error('Error embedding image:', imageError);
              // Fallback to text if image embedding fails
              const fontSize = Math.min(12, pdfHeight / 2);
              firstPage.drawText(`[Image: ${imageFiles[field.id].name}]`, {
                x: pdfX + 5,
                y: pdfY + (pdfHeight / 2) - (fontSize / 2),
                size: fontSize,
                color: window.PDFLib.rgb(0, 0, 0),
              });
            }
          } else {
            // Handle text fields
            let displayText = '';

            if (field.type === 'checkbox' && Array.isArray(value)) {
              displayText = value.join(', ');
            } else {
              displayText = value.toString();
            }

            // Add text to PDF
            if (displayText) {
              const fontSize = Math.min(12, pdfHeight / 2);

              // Handle multi-line text for textarea
              if (field.type === 'textarea') {
                const lines = displayText.split('\n');
                const lineHeight = fontSize * 1.2;

                lines.forEach((line, index) => {
                  const textY = pdfY + pdfHeight - (fontSize / 2) - (index * lineHeight);
                  if (textY > pdfY && window.PDFLib) { // Only draw if within field bounds
                    firstPage.drawText(line, {
                      x: pdfX + 5,
                      y: textY,
                      size: fontSize,
                      color: window.PDFLib.rgb(0, 0, 0),
                    });
                  }
                });
              } else {
                firstPage.drawText(displayText, {
                  x: pdfX + 5,
                  y: pdfY + (pdfHeight / 2) - (fontSize / 2),
                  size: fontSize,
                  color: window.PDFLib.rgb(0, 0, 0),
                });
              }
            }
          }
        }
      }

      // Add metadata
      pdfDoc.setTitle(`Filled Form - ${jsonTemplate.document?.name || 'Document'}`);
      pdfDoc.setSubject('Filled PDF Form');
      pdfDoc.setCreator('PDF Form Reader');
      pdfDoc.setProducer('PDF Form Reader');
      pdfDoc.setCreationDate(new Date());

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Download the filled PDF
      const a = document.createElement('a');
      a.href = url;
      a.download = `filled_${pdfFile.name}`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating filled PDF:', error);
      alert('Error generating filled PDF. Please try again.');
    }
  };

  const renderFormField = (field: Field) => {
    const hasError = validationErrors[field.id];
    const baseClasses = `w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${hasError ? 'border-red-500' : 'border-gray-300'
      }`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={baseClasses}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={formData[field.id] || ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={baseClasses}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={formData[field.id] || ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={baseClasses}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={baseClasses}
          />
        );

      case 'select':
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options?.map((option: string, index: number) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(formData[field.id] || []).includes(option)}
                  onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                  className="rounded"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={formData[field.id] || ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={`${baseClasses} min-h-[100px] resize-vertical`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={4}
          />
        );

      case 'image':
        return (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(field.id, file);
                }
              }}
              className={baseClasses}
            />
            {formData[field.id] && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {formData[field.id]}
              </div>
            )}
            {imageFiles[field.id] && (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(imageFiles[field.id])}
                  alt="Preview"
                  className="max-w-full max-h-32 object-contain border rounded"
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">PDF Form Reader</h1>

          {/* File Upload Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => pdfInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload size={20} />
                Upload PDF
              </button>
              <button
                onClick={() => jsonInputRef.current?.click()}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText size={20} />
                Upload Template
              </button>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePDFUpload}
                className="hidden"
              />
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={handleJSONUpload}
                className="hidden"
              />

              {/* Status indicators */}
              <div className="flex items-center gap-4">
                {pdfFile && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle size={16} />
                    PDF: {pdfFile.name}
                  </div>
                )}
                {jsonTemplate && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle size={16} />
                    Template: {jsonTemplate.document?.name || 'Loaded'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          {pdfUrl && jsonTemplate ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PDF Viewer */}
              <div className="lg:col-span-2">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h2 className="text-xl font-semibold mb-4">PDF with Form Fields</h2>
                  <div className="relative inline-block">
                    <canvas
                      ref={canvasRef}
                      className="border border-gray-300 max-w-full"
                    />
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute top-0 left-0 border border-gray-300 max-w-full pointer-events-none"
                    />
                  </div>
                  <div className="mt-4 text-sm">
                    <div className="font-medium text-gray-700 mb-2">Field Status:</div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm border-2 border-gray-400 bg-gray-100"></span>
                        Empty
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm border-2 border-green-500 bg-green-100"></span>
                        Filled
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm border-2 border-red-500 bg-red-100"></span>
                        Error
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-red-500">*</span>
                        Required
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Form Fields</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {jsonTemplate.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFormField(field)}
                        {validationErrors[field.id] && (
                          <div className="text-red-500 text-xs">
                            {validationErrors[field.id]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`w-3 h-3 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className={isFormValid ? 'text-green-600' : 'text-red-600'}>
                      {isFormValid ? 'Form is valid' : 'Form has errors'}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Eye size={20} />
                    {showPreview ? 'Hide' : 'Show'} Form Data
                  </button>

                  <button
                    onClick={generateFilledPDF}
                    disabled={!isFormValid}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download size={20} />
                    Download Filled Form
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-500 mb-4">
                <FileText size={48} className="mx-auto mb-4" />
                <p className="text-lg">Upload both a PDF file and a JSON template to get started</p>
                <p className="text-sm mt-2">
                  The JSON template should be created using the PDF Document Manager
                </p>
              </div>
            </div>
          )}

          {/* Form Data Preview */}
          {showPreview && jsonTemplate && (
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Current Form Data</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify({
                  document: jsonTemplate.document,
                  submissionDate: new Date().toISOString(),
                  data: formData,
                  validation: {
                    isValid: isFormValid,
                    errors: validationErrors
                  }
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FormFiller;