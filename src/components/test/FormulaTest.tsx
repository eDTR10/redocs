import React, { useState } from 'react';
import { evaluate } from 'mathjs';

interface TestField {
  id: string;
  label: string;
  type: 'number';
  formula?: string;
}

const FormulaTest: React.FC = () => {
  const [fields] = useState<TestField[]>([
    { id: 'field1', label: 'Field 1', type: 'number' },
    { id: 'field2', label: 'Field 2', type: 'number' },
    { id: 'sum_field', label: 'Sum', type: 'number', formula: 'field1 + field2' },
    { id: 'product_field', label: 'Product', type: 'number', formula: 'field1 * field2' },
    { id: 'complex_field', label: 'Complex', type: 'number', formula: '(field1 + field2) * 0.1' }
  ]);

  const [values, setValues] = useState<Record<string, number>>({
    field1: 10,
    field2: 20
  });

  const evaluateFormula = (formula: string, fieldId: string): number | string => {
    if (!formula) return '';
    
    try {
      let expression = formula;
      const fieldReferences = formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
      
      fieldReferences.forEach(ref => {
        if (ref !== fieldId && values[ref] !== undefined) {
          expression = expression.replace(new RegExp(`\\b${ref}\\b`, 'g'), values[ref].toString());
        } else if (ref !== fieldId) {
          expression = expression.replace(new RegExp(`\\b${ref}\\b`, 'g'), '0');
        }
      });
      
      const result = evaluate(expression);
      return typeof result === 'number' ? parseFloat(result.toFixed(2)) : result;
    } catch (error) {
      return 'Error';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Formula Test</h2>
      
      {fields.map(field => (
        <div key={field.id} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.formula && <span className="text-blue-600 text-xs ml-2">({field.formula})</span>}
          </label>
          
          <input
            type="number"
            className={`w-full p-2 border rounded ${field.formula ? 'bg-blue-50 border-blue-300' : ''}`}
            value={field.formula ? evaluateFormula(field.formula, field.id) : (values[field.id] || '')}
            onChange={(e) => !field.formula && setValues({
              ...values,
              [field.id]: parseFloat(e.target.value) || 0
            })}
            disabled={!!field.formula}
          />
          
          {field.formula && (
            <div className="text-xs text-blue-600 mt-1">
              📊 Auto-calculated
            </div>
          )}
        </div>
      ))}
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-2">Test Values:</h3>
        <pre className="text-sm">{JSON.stringify(values, null, 2)}</pre>
      </div>
    </div>
  );
};

export default FormulaTest;
