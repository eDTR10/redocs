import React from 'react';

interface DocumentTypeSelectProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const DOCUMENT_TYPES = [
    { value: '', label: 'Select Document Type' },
    { value: 'purchase-request', label: 'Purchase Request' },
    // Add more document types as needed
    // { value: 'purchase-order', label: 'Purchase Order' },
    // { value: 'memo', label: 'Memo' },
    // { value: 'letter', label: 'Letter' },
    // { value: 'report', label: 'Report' },
];

const DocumentTypeSelect: React.FC<DocumentTypeSelectProps> = ({ value, onChange, disabled }) => (
    <select
        className="md:px-2 px-3 py-1 md:text-xs text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
    >
        {DOCUMENT_TYPES.map(type => (
            <option key={type.value} value={type.value} disabled={type.value === ''}>
                {type.label}
            </option>
        ))}
    </select>
);

export default DocumentTypeSelect;
