import React, { useRef, useEffect, useState } from 'react';
import { evaluate } from 'mathjs';

// Extend Window interface for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// Field interface definition
interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'table' | 'list' | 'textarea' | 'email' | 'image' | 'group' | 'signature';
  required: boolean;
  options?: string[];
  coordinates: { x: number; y: number; width: number; height: number } | null;
  page: number;
  formula?: string;
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
    additionalFields?: any[];
  };
  style?: {
    fontSize: string;
    color: string;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
  };
}

// Formula evaluation function with circular reference protection
const evaluateFormula = (formula: string, fields: Field[], documentData: Record<string, any>, evaluating = new Set<string>(), currentRow?: number, currentTableField?: Field): number => {
  if (!formula.trim()) return 0;
  
  try {
    let processedFormula = formula;
    
    // Handle table column references (table.columnName format)
    if (currentRow !== undefined && currentTableField?.tableConfig) {
      const tableColumnRegex = /table\.(\w+)/g;
      processedFormula = processedFormula.replace(tableColumnRegex, (_, columnName) => {
        const columnIndex = currentTableField.tableConfig!.columns.findIndex(
          col => col.label.toLowerCase().replace(/\s+/g, '') === columnName.toLowerCase()
        );
        
        if (columnIndex !== -1) {
          const cellKey = `${currentTableField.id}_${currentRow}_${columnIndex}`;
          const cellValue = documentData[cellKey];
          
          if (cellValue !== undefined && cellValue !== '') {
            const numericValue = parseFloat(cellValue) || 0;
            return numericValue.toString();
          }
        }
        
        return '0';
      });
    }
    
    // Replace field references with their values
    fields.forEach(field => {
      if (!field.id) return;
      
      if (evaluating.has(field.id)) {
        console.warn(`Circular reference detected for field: ${field.id}`);
        return;
      }
      
      const fieldRegex = new RegExp(`\\b${field.id}\\b`, 'g');
      if (processedFormula.match(fieldRegex)) {
        let fieldValue = 0;
        
        if (field.formula && field.formula.trim()) {
          evaluating.add(field.id);
          fieldValue = evaluateFormula(field.formula, fields, documentData, evaluating);
          evaluating.delete(field.id);
        } else {
          fieldValue = parseFloat(documentData[field.id] || '0') || 0;
        }
        
        processedFormula = processedFormula.replace(fieldRegex, fieldValue.toString());
      }
    });
    
    // Handle table field references (table_row_col format)
    const tableFieldRegex = /table_(\d+)_(\d+)/g;
    processedFormula = processedFormula.replace(tableFieldRegex, (_, row, col) => {
      const rowIndex = parseInt(row);
      const colIndex = parseInt(col);
      
      for (const field of fields) {
        if (field.type === 'table' && field.id) {
          const cellKey = `${field.id}_${rowIndex}_${colIndex}`;
          const cellValue = documentData[cellKey];
          
          if (cellValue !== undefined && cellValue !== '') {
            const column = field.tableConfig?.columns?.[colIndex];
            if (column && column.formula) {
              const calculatedValue = evaluateFormula(column.formula, fields, documentData, evaluating, rowIndex, field);
              return calculatedValue.toString();
            }
            
            const numericValue = parseFloat(cellValue) || 0;
            return numericValue.toString();
          }
        }
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

// Helper function to get field value (with formula evaluation)
const getFieldValue = (field: Field, fields: Field[], documentData: Record<string, any>, currentRow?: number, currentTableField?: Field): string => {
  if (process.env.NODE_ENV === 'development' && documentData[field.id]) {
    console.log(`Getting value for field ${field.id}: ${documentData[field.id]}`);
  }
  
  if (field.formula && field.formula.trim()) {
    const result = evaluateFormula(field.formula, fields, documentData, new Set<string>(), currentRow, currentTableField);
    return result.toString();
  }
  
  const fieldValue = documentData[field.id] || '';
  return fieldValue;
};

interface DocumentPDFViewerProps {
  pdfUrl: string;
  fields: Field[];
  documentData: Record<string, any>;
}

export const DocumentPDFViewer: React.FC<DocumentPDFViewerProps> = ({
  pdfUrl,
  fields,
  documentData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null); // Store current render task
  const currentPdfUrlRef = useRef<string | null>(null); // Track current PDF URL

  // PDF.js setup
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
  }, []);

  useEffect(() => {
    if (pdfUrl && window.pdfjsLib && pdfUrl !== currentPdfUrlRef.current) {
      renderPDF(pdfUrl);
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (pdfLoaded) {
      drawDocumentData();
    }
  }, [fields, documentData, pdfLoaded]);

  // Cleanup function to cancel ongoing renders
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, []);

  const renderPDF = async (url: string) => {
    if (!window.pdfjsLib) {
      setPdfError('PDF.js library not loaded');
      return;
    }

    // Cancel any ongoing render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    // Don't start new render if already loading the same URL
    if (pdfLoading && currentPdfUrlRef.current === url) {
      return;
    }

    setPdfLoading(true);
    setPdfError(null);
    setPdfLoaded(false);
    currentPdfUrlRef.current = url;

    try {
      const pdf = await window.pdfjsLib.getDocument(url).promise;
      const page = await pdf.getPage(1);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (!canvas || !overlayCanvas) {
        throw new Error('Canvas elements not found');
      }

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      overlayCanvas.height = viewport.height;
      overlayCanvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      // Store the render task so we can cancel it if needed
      renderTaskRef.current = page.render(renderContext);
      
      await renderTaskRef.current.promise;
      
      // Only update state if this is still the current render task
      if (renderTaskRef.current && currentPdfUrlRef.current === url) {
        setPdfLoaded(true);
        setPdfLoading(false);
        renderTaskRef.current = null;
      }
    } catch (error) {
      // Only handle error if this render wasn't cancelled
      if (currentPdfUrlRef.current === url) {
        console.error('Error rendering PDF:', error);
        if (error instanceof Error && error.name !== 'RenderingCancelledException') {
          setPdfError(error.message);
        } else if (!(error instanceof Error)) {
          setPdfError('Unknown error occurred');
        }
        setPdfLoading(false);
        renderTaskRef.current = null;
      }
    }
  };

  // Helper function to construct font string with all styles
  const getFontString = (field: Field, size?: string) => {
    const fontSize = size || field.style?.fontSize || '12';
    const fontWeight = field.style?.fontWeight || 'normal';
    const fontStyle = field.style?.fontStyle || 'normal';
    const fontFamily = field.style?.fontFamily || 'Palatino, "Palatino Linotype", serif';
    
    return `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  };

  const drawDocumentData = () => {
    const overlayCanvas = overlayCanvasRef.current;
    const canvas = canvasRef.current;

    if (!overlayCanvas || !canvas) return;

    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Only log once for debugging, not for every field
    if (process.env.NODE_ENV === 'development') {
      console.log('DocumentPDFViewer - Drawing document data:', { 
        fieldsCount: fields.length,
        documentDataKeys: Object.keys(documentData).slice(0, 5), // Only show first 5 keys
        hasData: Object.keys(documentData).length > 0
      });
    }

    // Draw field values
    fields.forEach(field => {
      if (field.type === 'group') {
        drawGroupField(ctx, field);
      } else if (field.coordinates) {
        drawFieldValue(ctx, field);
      }
    });
  };

  const drawGroupField = (ctx: CanvasRenderingContext2D, field: Field) => {
    if (!field.groupConfig?.fields) return;

    const groupData = documentData[field.id] || {};
    
    field.groupConfig.fields.forEach(subField => {
      if (!subField.coordinates) return;
      
      const subValue = groupData[subField.id];
      drawFieldValue(ctx, subField, subValue);
    });
  };

  const drawFieldValue = (ctx: CanvasRenderingContext2D, field: Field, customValue?: any) => {
    if (!field.coordinates) return;

    const value = customValue !== undefined ? customValue : getFieldValue(field, fields, documentData);
    
    // Only log in development mode and for fields with values
    if (process.env.NODE_ENV === 'development' && value) {
      console.log(`Drawing field ${field.id}: ${field.type} = "${value}"`);
    }
    
    ctx.fillStyle = field.style?.color || '#000000';
    ctx.font = getFontString(field);
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        ctx.fillStyle = field.style?.color || '#000000';
        ctx.font = getFontString(field);
        ctx.fillText(value, field.coordinates.x + 5, field.coordinates.y + (field.coordinates.height / 2) + 5);
        break;

      case 'date':
        const dateValue = value ? new Date(value).toLocaleDateString() : '';
        ctx.fillText(dateValue, field.coordinates.x + 5, field.coordinates.y + (field.coordinates.height / 2) + 5);
        break;

      case 'select':
        ctx.fillText(value, field.coordinates.x + 5, field.coordinates.y + (field.coordinates.height / 2) + 5);
        break;

      case 'checkbox':
        const isChecked = value;
        ctx.strokeStyle = field.style?.color || '#000000';
        ctx.lineWidth = 1;
        const boxSize = Math.min(parseInt(field.style?.fontSize || '12'), field.coordinates.height - 4);
        const x = field.coordinates.x + 2;
        const y = field.coordinates.y + (field.coordinates.height / 2) - (boxSize / 2);
        
        ctx.strokeRect(x, y, boxSize, boxSize);
        
        if (isChecked) {
          ctx.fillStyle = field.style?.color || '#000000';
          ctx.fillRect(x + 1, y + 1, boxSize - 2, boxSize - 2);
        }
        break;

      case 'textarea':
        const textareaValue = value || '';
        const fontSize = parseInt(field.style?.fontSize || '12');
        const lineHeight = fontSize + 4;
        const maxLines = Math.floor(field.coordinates.height / lineHeight);
        
        const wrapText = (text: string, maxWidth: number) => {
          const words = text.split(' ');
          const lines = [];
          let currentLine = words[0] || '';

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth - 10) {
              currentLine += ' ' + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
          return lines;
        };

        const paragraphs = textareaValue.split('\n');
        let currentY = field.coordinates.y + lineHeight;
        let lineCount = 0;

        for (const paragraph of paragraphs) {
          if (lineCount >= maxLines) break;
          
          const wrappedLines = wrapText(paragraph, field.coordinates.width);
          for (const line of wrappedLines) {
            if (lineCount >= maxLines) break;
            
            ctx.fillText(
              line,
              field.coordinates.x + 5,
              currentY
            );
            currentY += lineHeight;
            lineCount++;
          }
        }
        break;

      case 'table':
        drawTableField(ctx, field);
        break;

      case 'image':
        const imageData = documentData[field.id];
        if (imageData) {
          const img = new Image();
          img.src = imageData;
          img.onload = () => {
            ctx.drawImage(
              img,
              field.coordinates!.x,
              field.coordinates!.y,
              field.coordinates!.width,
              field.coordinates!.height
            );
          };
        } else {
          ctx.strokeStyle = '#CBD5E1';
          ctx.strokeRect(
            field.coordinates.x,
            field.coordinates.y,
            field.coordinates.width,
            field.coordinates.height
          );
          ctx.fillStyle = '#94A3B8';
          ctx.font = getFontString(field);
          ctx.textAlign = 'center';
          ctx.fillText(
            'No image',
            field.coordinates.x + field.coordinates.width / 2,
            field.coordinates.y + field.coordinates.height / 2
          );
          ctx.textAlign = 'left';
        }
        break;
    }
  };

  const drawTableField = (ctx: CanvasRenderingContext2D, field: Field) => {
    if (!field.tableConfig || !field.coordinates) return;
    
    const baseCellHeight = 25;
    let hasContent = false;
    
    // Calculate total width from columns to determine if we need to scale
    const totalConfigWidth = field.tableConfig.columns.reduce((sum, col) => sum + (col.width || 0), 0);
    const availableWidth = field.coordinates.width;
    const widthScale = totalConfigWidth > 0 ? availableWidth / totalConfigWidth : 1;
    
    // First pass: calculate row heights based on content
    const rowHeights: number[] = [];
    for (let row = 0; row < field.tableConfig.rows; row++) {
      let maxRowHeight = baseCellHeight;
      
      field.tableConfig.columns.forEach((col, colIndex) => {
        const cellKey = `${field.id}_${row}_${colIndex}`;
        const cellValue = documentData[cellKey];
        
        if (cellValue !== undefined && cellValue !== '' && cellValue !== null) {
          hasContent = true;
          
          if (col.type === 'textarea' && cellValue) {
            const lines = cellValue.toString().split('\n').length;
            const estimatedHeight = Math.max(baseCellHeight, lines * 16 + 10);
            maxRowHeight = Math.max(maxRowHeight, estimatedHeight);
          }
        }
      });
      
      rowHeights.push(maxRowHeight);
    }
    
    // Find last row with content
    let lastContentRow = -1;
    for (let row = 0; row < field.tableConfig.rows; row++) {
      for (let colIndex = 0; colIndex < field.tableConfig.columns.length; colIndex++) {
        const cellKey = `${field.id}_${row}_${colIndex}`;
        const cellValue = documentData[cellKey];
        if (cellValue !== undefined && cellValue !== '' && cellValue !== null) {
          lastContentRow = row;
        }
      }
    }
    
    const effectiveRows = Math.max(lastContentRow + 1, 1);
    
    // Calculate cumulative heights
    let cumulativeHeight = 0;
    const rowYPositions: number[] = [];
    for (let i = 0; i <= effectiveRows; i++) {
      rowYPositions.push(cumulativeHeight);
      if (i < effectiveRows) {
        cumulativeHeight += rowHeights[i];
      }
    }
    
    // Check if we need to add "nothing follows" row
    let nothingFollowsRowHeight = 0;
    if (hasContent && lastContentRow < field.tableConfig.rows - 1) {
      nothingFollowsRowHeight = baseCellHeight;
    }
    
    const totalContentHeight = cumulativeHeight + nothingFollowsRowHeight;
    const maxAllowedHeight = field.coordinates.height;
    
    // Adjust if content exceeds field height
    let visibleRows = effectiveRows;
    let showNothingFollows = hasContent && lastContentRow < field.tableConfig.rows - 1;
    
    if (totalContentHeight > maxAllowedHeight) {
      let currentHeight = 0;
      for (let i = 0; i < effectiveRows; i++) {
        currentHeight += rowHeights[i];
        if (currentHeight + (showNothingFollows ? nothingFollowsRowHeight : 0) > maxAllowedHeight) {
          visibleRows = i;
          showNothingFollows = false;
          break;
        }
      }
    }
    
    // Draw table content
    let currentX = field.coordinates.x;
    field.tableConfig!.columns.forEach((col, colIndex) => {
      const colWidth = col.width ? col.width * widthScale : availableWidth / field.tableConfig!.columns.length;
      
      for (let row = 0; row < visibleRows; row++) {
        const cellKey = `${field.id}_${row}_${colIndex}`;
        let cellValue = documentData[cellKey];
        
        // Handle formula evaluation for table cells
        if (col.formula && col.formula.trim()) {
          cellValue = evaluateFormula(col.formula, fields, documentData, new Set<string>(), row, field).toString();
        }
        
        if (cellValue !== undefined && cellValue !== '' && cellValue !== null) {
          const cellY = field.coordinates!.y + rowYPositions[row];
          const cellHeight = rowHeights[row];
          
          ctx.fillStyle = field.style?.color || '#000000';
          ctx.font = getFontString(field, col.fontSize || field.style?.fontSize);
          
          if (col.type === 'textarea' && cellValue) {
            // Handle multiline text in table cells
            const lines = cellValue.toString().split('\n');
            const lineHeight = parseInt(col.fontSize || field.style?.fontSize || '12') + 2;
            let textY = cellY + lineHeight;
            
            lines.forEach((line: string) => {
              if (textY + lineHeight <= cellY + cellHeight) {
                ctx.fillText(line, currentX + 5, textY);
                textY += lineHeight;
              }
            });
          } else {
            // Single line text
            const textY = cellY + (cellHeight / 2) + 5;
            ctx.fillText(cellValue.toString(), currentX + 5, textY);
          }
        }
      }
      currentX += colWidth;
    });
    
    // Draw "nothing follows" row if there's space
    if (showNothingFollows) {
      const nothingFollowsY = field.coordinates.y + rowYPositions[visibleRows];
      ctx.font = getFontString(field, '11');
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      
      ctx.fillText(
        'xxx nothing follows xxx',
        field.coordinates.x + (field.coordinates.width / 2),
        nothingFollowsY + (nothingFollowsRowHeight / 2)
      );
    }
    
    // Draw grid lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1, 2]);
    
    const totalVisibleHeight = showNothingFollows ? 
      rowYPositions[visibleRows] + nothingFollowsRowHeight : 
      rowYPositions[visibleRows];
    
    // Vertical lines (skip outer borders)
    currentX = field.coordinates.x;
    for (let colIndex = 0; colIndex < field.tableConfig.columns.length - 1; colIndex++) {
      const colWidth = field.tableConfig.columns[colIndex].width ? 
        field.tableConfig.columns[colIndex].width * widthScale : 
        availableWidth / field.tableConfig.columns.length;
      currentX += colWidth;
      
      ctx.beginPath();
      ctx.moveTo(currentX, field.coordinates.y);
      ctx.lineTo(currentX, field.coordinates.y + totalVisibleHeight);
      ctx.stroke();
    }
    
    // Horizontal lines (skip top border)
    for (let i = 1; i <= visibleRows; i++) {
      const y = field.coordinates.y + rowYPositions[i];
      ctx.beginPath();
      ctx.moveTo(field.coordinates.x, y);
      ctx.lineTo(field.coordinates.x + field.coordinates.width, y);
      ctx.stroke();
    }
    
    // Line above "nothing follows" if shown
    if (showNothingFollows) {
      const y = field.coordinates.y + rowYPositions[visibleRows] + nothingFollowsRowHeight;
      ctx.beginPath();
      ctx.moveTo(field.coordinates.x, y);
      ctx.lineTo(field.coordinates.x + field.coordinates.width, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    ctx.textAlign = 'left';
  };

  return (
    <div className="w-full">
      {pdfUrl ? (
        <div className="relative inline-block max-w-full">
          {pdfLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}
          {pdfError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded border border-red-200">
              <div className="text-center text-red-600 p-4">
                <p className="font-medium">Error loading PDF</p>
                <p className="text-sm mt-1">{pdfError}</p>
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="border border-gray-300 max-w-full"
            style={{ display: pdfLoading || pdfError ? 'none' : 'block' }}
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 border border-gray-300 max-w-full pointer-events-none"
            style={{ display: pdfLoading || pdfError ? 'none' : 'block' }}
          />
        </div>
      ) : (
        <div className="h-96 flex items-center justify-center text-gray-500 border border-gray-300 rounded">
          No PDF template available
        </div>
      )}
    </div>
  );
};
