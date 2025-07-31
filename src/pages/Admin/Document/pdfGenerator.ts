import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { evaluate } from 'mathjs';

// Field interface definition
export interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'table' | 'list' | 'textarea' | 'email' | 'image' | 'group' | 'signature';
  required: boolean;
  options?: string[];
  coordinates: { x: number; y: number; width: number; height: number } | null;
  page: number;
  formula?: string; // For arithmetic operations like Excel
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
}



// Formula evaluation function with circular reference protection
const evaluateFormula = (formula: string, fields: Field[], previewValues: Record<string, any>, evaluating = new Set<string>(), currentRow?: number, currentTableField?: Field): number | null => {
  if (!formula.trim()) return null;
  
  try {
    let processedFormula = formula;
    let hasValidData = false; // Track if we have any actual data
    
    // Handle table column references (table.columnName format)
    if (currentRow !== undefined && currentTableField?.tableConfig) {
      const tableColumnRegex = /table\.(\w+)/g;
      processedFormula = processedFormula.replace(tableColumnRegex, (match, columnName) => {
        // Find the column index by name (case-insensitive)
        const columnIndex = currentTableField.tableConfig!.columns.findIndex(
          col => col.label.toLowerCase().replace(/\s+/g, '') === columnName.toLowerCase()
        );
        
        if (columnIndex !== -1) {
          const cellKey = `${currentTableField.id}_${currentRow}_${columnIndex}`;
          const cellValue = previewValues[cellKey];
          console.log(`PDF Table formula: ${match} -> ${cellKey} = ${cellValue}`);
          
          if (cellValue !== undefined && cellValue !== '' && cellValue !== null) {
            hasValidData = true;
            const numericValue = parseFloat(cellValue) || 0;
            return numericValue.toString();
          }
        }
        
        console.warn(`PDF: Column ${columnName} not found in table ${currentTableField.id}`);
        return '0';
      });
    }
    
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
          const result = evaluateFormula(field.formula, fields, previewValues, evaluating);
          evaluating.delete(field.id);
          fieldValue = result !== null ? result : 0;
        } else {
          // Regular field, get its value
          const rawValue = previewValues[field.id];
          if (rawValue !== undefined && rawValue !== '' && rawValue !== null) {
            hasValidData = true;
            fieldValue = parseFloat(rawValue) || 0;
          }
        }
        
        processedFormula = processedFormula.replace(fieldRegex, fieldValue.toString());
      }
    });
    
    // Handle table field references (table_row_col format)
    const tableFieldRegex = /table_(\d+)_(\d+)/g;
    processedFormula = processedFormula.replace(tableFieldRegex, (_, row, col) => {
      // Find any table field and try to get the cell value
      const rowIndex = parseInt(row);
      const colIndex = parseInt(col);
      
      console.log(`PDF: Looking for table cell: table_${rowIndex}_${colIndex}`);
      
      // Look for cell values in the format: tableFieldId_row_col
      for (const field of fields) {
        if (field.type === 'table' && field.id) {
          const cellKey = `${field.id}_${rowIndex}_${colIndex}`;
          const cellValue = previewValues[cellKey];
          console.log(`PDF: Checking field ${field.id}, key: ${cellKey}, value:`, cellValue);
          
          if (cellValue !== undefined && cellValue !== '' && cellValue !== null) {
            hasValidData = true;
            // Check if this cell has a formula
            const column = field.tableConfig?.columns?.[colIndex];
            if (column && column.formula) {
              // Evaluate the cell formula
              const cellFormula = column.formula.replace(/row/g, rowIndex.toString());
              try {
                const result = evaluate(cellFormula);
                return result.toString();
              } catch (e) {
                console.warn(`PDF: Error evaluating cell formula: ${e}`);
                return '0';
              }
            }
            
            const numericValue = parseFloat(cellValue) || 0;
            console.log(`PDF: Returning numeric value: ${numericValue}`);
            return numericValue.toString();
          }
        }
      }
      
      console.log(`PDF: No value found for table_${rowIndex}_${colIndex}, returning 0`);
      return '0';
    });
    
    // If no valid data was found in any of the referenced fields, return null
    if (!hasValidData) {
      console.log(`PDF: No valid data found for formula, returning null`);
      return null;
    }
    
    console.log(`PDF: Final processed formula: ${processedFormula}`);
    
    const result = evaluate(processedFormula);
    return typeof result === 'number' ? result : null;
  } catch (error) {
    console.error('PDF Formula evaluation error:', error);
    return null;
  }
};

// Helper function to get PDF font based on fontFamily, fontWeight, and fontStyle
function getPDFFont(pdfDoc: PDFDocument, fontFamily: string, fontWeight: string, fontStyle: string) {
  // Map font families to PDF-lib standard fonts
  const isItalic = fontStyle === 'italic' || fontStyle === 'oblique';
  const isBold = fontWeight === 'bold' || parseInt(fontWeight) >= 600;
  
  // For Palatino and other serif fonts, use Times Roman as fallback
  if (fontFamily.includes('Palatino') || fontFamily.includes('Times') || fontFamily.includes('Georgia')) {
    if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    if (isBold) return pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    if (isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    return pdfDoc.embedFont(StandardFonts.TimesRoman);
  }
  
  // For Courier/monospace fonts
  if (fontFamily.includes('Courier')) {
    if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
    if (isBold) return pdfDoc.embedFont(StandardFonts.CourierBold);
    if (isItalic) return pdfDoc.embedFont(StandardFonts.CourierOblique);
    return pdfDoc.embedFont(StandardFonts.Courier);
  }
  
  // For all other fonts (Arial, Helvetica, Calibri, etc.), use Helvetica
  if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  if (isBold) return pdfDoc.embedFont(StandardFonts.HelveticaBold);
  if (isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  return pdfDoc.embedFont(StandardFonts.Helvetica);
}

// Helper function to render a single field (used for both regular fields and group sub-fields)
async function renderSingleField(
  field: Field, 
  value: any, 
  page: any, 
  pdfDoc: PDFDocument, 
  values: Record<string, any>,
  PREVIEW_SCALE: number,
  allFields?: Field[] // Add fields parameter for formula evaluation
) {
  if (!field.coordinates) return;
  
  // Get canvas coordinates
  const { x: canvasX, y: canvasY, width: canvasWidth, height: canvasHeight } = field.coordinates;
  
  // Convert from canvas coordinates (scaled) to PDF coordinates
  // PDF coordinates start from bottom-left, canvas from top-left
  const pdfX = canvasX / PREVIEW_SCALE;
  const pdfY = page.getHeight() - ((canvasY / PREVIEW_SCALE) + (canvasHeight / PREVIEW_SCALE));
  const pdfWidth = canvasWidth / PREVIEW_SCALE;
  const pdfHeight = canvasHeight / PREVIEW_SCALE;
  
  // Get style properties with defaults matching FieldManager
  const fontSize = (parseInt(field.style?.fontSize || '12') / PREVIEW_SCALE) + 1.5;
  const color = field.style?.color ? parseColor(field.style.color) : rgb(0, 0, 0);
  const fontFamily = field.style?.fontFamily || 'Palatino, "Palatino Linotype", serif';
  const fontWeight = field.style?.fontWeight || 'normal';
  const fontStyle = field.style?.fontStyle || 'normal';
  
  // Get the appropriate PDF font
  const font = await getPDFFont(pdfDoc, fontFamily, fontWeight, fontStyle);
  
  try {
    // Handle formula evaluation for number and text fields
    let displayValue = value;
    if ((field.type === 'number' || field.type === 'text') && field.formula && allFields) {
      const formulaResult = evaluateFormula(field.formula, allFields, values);
      displayValue = formulaResult !== null ? formulaResult.toString() : '';
    }

    switch (field.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'date':
      case 'select':
        if (displayValue !== undefined && displayValue !== '' && displayValue !== null) {
          page.drawText(String(displayValue || ''), {
            x: pdfX + 2,
            y: pdfY + (pdfHeight / 2) - (fontSize / 2),
            size: fontSize,
            color,
            font,
          });
        }
        break;
        
      case 'checkbox':
        console.log(`Processing checkbox ${field.id} with value:`, value, typeof value);
        
        // Use the same sizing logic as the preview
        const boxSize = Math.min(parseInt(field.style?.fontSize || '12'), pdfHeight - 4) / PREVIEW_SCALE;
        const checkboxX = pdfX + 2;
        const checkboxY = pdfY + (pdfHeight / 2) - (boxSize / 2);
        
        // Draw checkbox border
        page.drawRectangle({
          x: checkboxX,
          y: checkboxY,
          width: boxSize,
          height: boxSize,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: rgb(1, 1, 1), // White background
        });
        
        // Check if the checkbox is checked
        const isChecked = value === true || value === 'true' || value === 1 || value === '1' || value === 'on' || value === 'yes';
        if (isChecked) {
          console.log(`Drawing filled checkbox for ${field.id}`);
          
          // Fill the checkbox with a solid color (like the preview)
          page.drawRectangle({
            x: checkboxX + 1,
            y: checkboxY + 1,
            width: boxSize - 2,
            height: boxSize - 2,
            color: color, // Use the field's color
          });
        }
        break;

      case 'textarea':
        if (value) {
          const text = String(value);
          const actualFontSize = parseInt(field.style?.fontSize || '12'); // Use actual font size, not scaled
          const lineHeight = actualFontSize + 4; // Match PDFViewer exactly
          
          // Better text wrapping - improved space utilization
          const lines = [];
          const paragraphs = text.split('\n');
          
          for (const paragraph of paragraphs) {
            if (!paragraph.trim()) {
              lines.push('');
              continue;
            }
            
            const words = paragraph.split(/\s+/);
            let currentLine = '';
            
            for (const word of words) {
              const testLine = currentLine + (currentLine ? ' ' : '') + word;
              // Improved character width calculation for better space utilization
              const testWidth = testLine.length * actualFontSize * 0.5; // Reduced from 0.6 to 0.5 for better fit
              
              // Use more of the available width with reduced padding
              if (testWidth > canvasWidth - 16 && currentLine) { // Reduced from 10 to 16 for better padding
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            
            if (currentLine) {
              lines.push(currentLine);
            }
          }
          
          // Draw the wrapped text - improved positioning and spacing
          const maxLines = Math.floor((canvasHeight - 8) / lineHeight); // Account for top/bottom padding
          lines.slice(0, maxLines).forEach((line, index) => {
            // Better positioning calculation
            const canvasLineY = canvasY + 8 + lineHeight * (index + 0.8); // Added top padding and better line positioning
            const pdfLineY = page.getHeight() - (canvasLineY / PREVIEW_SCALE);
            
            page.drawText(line, {
              x: pdfX + 6, // Increased left padding from 4 to 6
              y: pdfLineY,
              size: fontSize, // Use the scaled fontSize for actual drawing
              color,
              font,
            });
          });
        }
        break;

      case 'table':
        if (field.tableConfig) {
          console.log(`Processing table ${field.id}`, field.tableConfig);
          
          // Calculate column widths to fill the entire field width
          const totalColumns = field.tableConfig.columns.length;
          const availableWidth = pdfWidth; // Use actual PDF width, not scaled
          
          // If columns have configured widths, use proportional distribution
          let columnWidths = [];
          const totalConfigWidth = field.tableConfig.columns.reduce((sum, col) => sum + (typeof col.width === 'number' ? col.width : 1), 0);
          
          for (let i = 0; i < totalColumns; i++) {
            const columnWidth = field.tableConfig.columns[i]?.width;
            const configWidth = typeof columnWidth === 'number' ? columnWidth : 1;
            const proportionalWidth = (configWidth / totalConfigWidth) * availableWidth;
            columnWidths.push(proportionalWidth);
          }
          
          const baseCellHeight = 25; // Keep in canvas units initially
          
          // Use the field's actual font size for table text (matching canvas)
          const tableFontSize = (parseInt(field.style?.fontSize || '11') );
          
          // Calculate row heights based on content (matching PDFViewer logic)
          const rowHeights = [];
          let hasContent = false;
          let lastContentRow = -1;
          
          for (let row = 0; row < field.tableConfig.rows; row++) {
            let maxRowHeight = baseCellHeight;
            let rowHasContent = false;
            
            field.tableConfig.columns.forEach((col, colIndex) => {
              let cellValue = values[`${field.id}_${row}_${colIndex}`] || '';
              
              // Check if this column has a formula
              if (col.formula && col.formula.trim() && allFields) {
                console.log(`PDF: Evaluating table cell formula for ${field.id}_${row}_${colIndex}:`, col.formula);
                const formulaResult = evaluateFormula(col.formula, allFields, values, new Set<string>(), row, field);
                // Only set cellValue if formula returns a valid result
                if (formulaResult !== null && formulaResult !== 0) {
                  cellValue = formulaResult.toString();
                } else if (formulaResult === null) {
                  cellValue = ''; // Don't show 0 for empty formulas
                } else {
                  cellValue = formulaResult.toString(); // Show 0 only if it's an actual calculated 0
                }
                console.log(`PDF: Table cell formula result: ${formulaResult} -> cellValue: "${cellValue}"`);
              }
              
              if (cellValue && cellValue !== '') {
                hasContent = true;
                rowHasContent = true;
                
                const colWidth = columnWidths[colIndex] * PREVIEW_SCALE; // Scale up for text calculations
                
                // Calculate required height for text wrapping - with padding consideration
                const words = String(cellValue).split(' ');
                const lines = [];
                let currentLine = '';
                
                // Character width calculation with padding consideration
                const avgCharWidth = tableFontSize * 0.4;
                const availableTextWidth = colWidth - 12; // Increased padding from 8 to 12 for better spacing
                
                for (const word of words) {
                  const testLine = currentLine + (currentLine ? ' ' : '') + word;
                  const textWidth = testLine.length * avgCharWidth;
                  
                  if (textWidth > availableTextWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                  } else {
                    currentLine = testLine;
                  }
                }
                if (currentLine) lines.push(currentLine);
                
                const requiredHeight = Math.max(baseCellHeight, lines.length * 16 + 10);
                maxRowHeight = Math.max(maxRowHeight, requiredHeight);
              }
            });
            
            if (rowHasContent) {
              lastContentRow = Math.max(lastContentRow, row);
            }
            
            rowHeights.push(maxRowHeight);
          }
          
          const effectiveRows = Math.max(lastContentRow + 1, 1);
          
          // Calculate cumulative heights (matching PDFViewer)
          let cumulativeHeight = 0;
          const rowYPositions = [];
          for (let i = 0; i <= effectiveRows; i++) {
            rowYPositions.push(cumulativeHeight);
            if (i < effectiveRows) {
              cumulativeHeight += rowHeights[i];
            }
          }
          
          // Check if we need "nothing follows" row - only if there's actual content and more rows available
          let nothingFollowsRowHeight = 0;
          if (hasContent && lastContentRow < field.tableConfig.rows - 1) {
            nothingFollowsRowHeight = baseCellHeight;
          }
          
          const totalContentHeight = cumulativeHeight + nothingFollowsRowHeight;
          const maxAllowedHeight = pdfHeight * PREVIEW_SCALE; // Scale back to canvas units
          
          // Adjust if content exceeds field height
          let visibleRows = effectiveRows;
          let showNothingFollows = hasContent && lastContentRow < field.tableConfig.rows - 1;
          
          if (totalContentHeight > maxAllowedHeight) {
            let currentHeight = 0;
            for (let i = 0; i < effectiveRows; i++) {
              if (currentHeight + rowHeights[i] + (showNothingFollows ? nothingFollowsRowHeight : 0) > maxAllowedHeight) {
                visibleRows = i;
                showNothingFollows = false;
                break;
              }
              currentHeight += rowHeights[i];
            }
          }
          
          // Convert measurements to PDF units for drawing
          const pdfRowYPositions = rowYPositions.map(pos => pos / PREVIEW_SCALE);
          const pdfNothingFollowsHeight = nothingFollowsRowHeight / PREVIEW_SCALE;
          const pdfColumnWidths = columnWidths; // Already in PDF units
          
          // Draw horizontal lines (skip top border)
          for (let i = 1; i <= visibleRows; i++) {
            page.drawLine({
              start: { x: pdfX, y: pdfY + pdfHeight - pdfRowYPositions[i] },
              end: { x: pdfX + pdfWidth, y: pdfY + pdfHeight - pdfRowYPositions[i] },
              color: rgb(0, 0, 0),
              thickness: 0.3,
              dashArray: [1, 2],
            });
          }
          
          // Line above "nothing follows" if shown
          if (showNothingFollows) {
            page.drawLine({
              start: { x: pdfX, y: pdfY + pdfHeight - (pdfRowYPositions[visibleRows] + pdfNothingFollowsHeight) },
              end: { x: pdfX + pdfWidth, y: pdfY + pdfHeight - (pdfRowYPositions[visibleRows] + pdfNothingFollowsHeight) },
              color: rgb(0, 0, 0),
              thickness: 0.3,
              dashArray: [1, 2],
            });
          }
          
          // Draw vertical lines (skip outer borders) - use proper column positions
          let currentX = pdfX;
          for (let colIndex = 0; colIndex < totalColumns - 1; colIndex++) {
            currentX += pdfColumnWidths[colIndex];
            
            const totalVisibleHeight = showNothingFollows ? 
              pdfRowYPositions[visibleRows] + pdfNothingFollowsHeight : 
              pdfRowYPositions[visibleRows];
            
            page.drawLine({
              start: { x: currentX, y: pdfY + pdfHeight - totalVisibleHeight },
              end: { x: currentX, y: pdfY + pdfHeight },
              color: rgb(0, 0, 0),
              thickness: 0.3,
              opacity: 0.5,
              dashArray: [1, 2],
            });
          }
          
          // Fill table with data - use proper column positioning
          currentX = pdfX;
          for (let colIndex = 0; colIndex < totalColumns; colIndex++) {
            const colWidth = pdfColumnWidths[colIndex];
            const canvasColWidth = colWidth * PREVIEW_SCALE; // Scale for text calculations
            
            for (let row = 0; row < visibleRows; row++) {
              let cellValue = values[`${field.id}_${row}_${colIndex}`] || '';
              
              // Check if this column has a formula and evaluate it
              const column = field.tableConfig.columns[colIndex];
              if (column && column.formula && column.formula.trim() && allFields) {
                console.log(`PDF: Evaluating table cell formula for ${field.id}_${row}_${colIndex}:`, column.formula);
                const formulaResult = evaluateFormula(column.formula, allFields, values, new Set<string>(), row, field);
                // Only set cellValue if formula returns a valid result
                if (formulaResult !== null && formulaResult !== 0) {
                  cellValue = formulaResult.toString();
                } else if (formulaResult === null) {
                  cellValue = ''; // Don't show 0 for empty formulas
                } else {
                  cellValue = formulaResult.toString(); // Show 0 only if it's an actual calculated 0
                }
                console.log(`PDF: Table cell formula result: ${formulaResult} -> cellValue: "${cellValue}"`);
              }
              
              if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                const cellX = currentX + 4 / PREVIEW_SCALE; // Increased padding from 2 to 4 for better text spacing
                const cellY = pdfY + pdfHeight - pdfRowYPositions[row] - (14 / PREVIEW_SCALE); // Slightly adjusted vertical position
                
                // Text wrapping for PDF - with padding consideration
                const text = String(cellValue);
                const words = text.split(' ');
                const lines = [];
                let currentLine = '';
                
                // Character width calculation with padding
                const avgCharWidth = tableFontSize * 0.4;
                const availableTextWidth = canvasColWidth - 12; // Consistent with height calculation padding
                
                for (const word of words) {
                  const testLine = currentLine + (currentLine ? ' ' : '') + word;
                  const textWidth = testLine.length * avgCharWidth;
                  
                  if (textWidth > availableTextWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                  } else {
                    currentLine = testLine;
                  }
                }
                if (currentLine) lines.push(currentLine);
                
                // Draw wrapped text with proper spacing
                lines.forEach((line, lineIndex) => {
                  const lineY = cellY - (lineIndex * (16 / PREVIEW_SCALE));
                  page.drawText(line, {
                    x: cellX,
                    y: lineY,
                    size: tableFontSize / PREVIEW_SCALE,
                    color,
                    font,
                  });
                });
              }
            }
            
            currentX += colWidth;
          }
          
          // Draw "nothing follows" text in its own row - only if there's actual content
          if (showNothingFollows && hasContent) {
            const nothingFollowsY = pdfY + pdfHeight - pdfRowYPositions[visibleRows] - (pdfNothingFollowsHeight / 2);
            
            // Calculate text width for proper centering
            const nothingFollowsText = 'xxx nothing follows xxx';
            const textSize = (tableFontSize * 0.8) / PREVIEW_SCALE;
            const estimatedTextWidth = nothingFollowsText.length * textSize * 0.6;
            
            page.drawText(nothingFollowsText, {
              x: pdfX + (pdfWidth / 2) - (estimatedTextWidth / 2),
              y: nothingFollowsY,
              size: textSize,
              color: rgb(0, 0, 0),
              opacity: 0.5,
              font: await getPDFFont(pdfDoc, fontFamily, 'normal', 'normal'),
            });
          }
        }
        break;
        
      case 'image':
        if (value) {
          try {
            console.log(`Processing image field ${field.id} with value:`, value);
            
            let imageBytes;
            let image;
            
            // Handle different image sources
            if (value.startsWith('data:')) {
              // Handle base64 data URLs
              const base64Data = value.split(',')[1];
              imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
            } else if (value.startsWith('blob:')) {
              // Handle blob URLs
              const response = await fetch(value);
              imageBytes = await response.arrayBuffer();
            } else {
              // Handle regular URLs
              const response = await fetch(value, {
                mode: 'cors',
                credentials: 'same-origin'
              });
              
              if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
              }
              
              imageBytes = await response.arrayBuffer();
            }
            
            console.log(`Image data loaded, size: ${imageBytes.byteLength} bytes`);
            
            // Determine image type and embed
            if (value.includes('data:image/png') || value.toLowerCase().includes('.png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else if (value.includes('data:image/jpeg') || value.includes('data:image/jpg') || 
                       value.toLowerCase().includes('.jpg') || value.toLowerCase().includes('.jpeg')) {
              image = await pdfDoc.embedJpg(imageBytes);
            } else {
              // Try PNG first, then JPG
              try {
                image = await pdfDoc.embedPng(imageBytes);
              } catch {
                image = await pdfDoc.embedJpg(imageBytes);
              }
            }
            
            // Calculate dimensions to fit within the field while maintaining aspect ratio
            const imgDims = image.scale(1);
            const scaleX = (pdfWidth - 8) / imgDims.width;
            const scaleY = (pdfHeight - 8) / imgDims.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
            
            const scaledWidth = imgDims.width * scale;
            const scaledHeight = imgDims.height * scale;
            
            // Center the image in the field
            const imgX = pdfX + (pdfWidth - scaledWidth) / 2;
            const imgY = pdfY + (pdfHeight - scaledHeight) / 2;
            
            page.drawImage(image, {
              x: imgX,
              y: imgY,
              width: scaledWidth,
              height: scaledHeight,
            });
            
            console.log(`Image successfully embedded at x:${imgX}, y:${imgY}, w:${scaledWidth}, h:${scaledHeight}`);
            
          } catch (error) {
            console.error(`Error embedding image for field ${field.id}:`, error);
            
            // Draw error placeholder
            page.drawRectangle({
              x: pdfX + 2,
              y: pdfY + 2,
              width: pdfWidth - 4,
              height: pdfHeight - 4,
              borderColor: rgb(1, 0, 0),
              borderWidth: 1,
            });
            
            page.drawText('Image Error', {
              x: pdfX + 4,
              y: pdfY + pdfHeight / 2,
              size: Math.min(fontSize, 8),
              color: rgb(1, 0, 0),
              font,
            });
          }
        }
        break;
    }
  } catch (error) {
    console.warn(`Failed to render field ${field.id}:`, error);
  }
}

export async function generatePDFWithFields(
  pdfUrl: string,
  fields: Field[],
  values: Record<string, any>
): Promise<PDFDocument> {
  console.log('PDF Generation - All field values:', values);
  console.log('PDF Generation - Field types:', fields.map(f => ({ id: f.id, type: f.type })));
  
  // PDF preview is rendered at this scale in the viewer
  const PREVIEW_SCALE = 1.5;
  
  const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  const pages = pdfDoc.getPages();
  
  // Replace forEach with for...of to properly handle async operations
  for (const field of fields) {
    const page = pages[field.page - 1];
    if (!page) continue;
    
    if (field.type === 'group') {
      // Handle group fields specially - render their sub-fields
      if (field.groupConfig?.fields) {
        const groupData = values[field.id] || {};
        
        for (const subField of field.groupConfig.fields) {
          if (!subField.coordinates) continue;
          
          const subFieldValue = groupData[subField.id];
          console.log(`Processing group sub-field ${subField.id} with value:`, subFieldValue);
          
          // Render the sub-field using the helper function
          await renderSingleField(subField, subFieldValue, page, pdfDoc, values, PREVIEW_SCALE, fields);
        }
      }
    } else {
      // Handle regular fields (non-group)
      if (!field.coordinates) continue;
      
      const value = values[field.id];
      console.log(`Processing regular field ${field.id} with value:`, value);
      
      // Render the field using the helper function
      await renderSingleField(field, value, page, pdfDoc, values, PREVIEW_SCALE, fields);
    }
  }
  
  return pdfDoc;
}

function parseColor(colorString: string) {
  if (colorString.startsWith('#')) {
    const hex = colorString.slice(1);
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(0, 0, 0);
}