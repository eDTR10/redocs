import { useState } from 'react';
import { FileText, Save, Calendar, User, Plus, Trash2 } from 'lucide-react';
import { PurchaseRequestItem } from '../../../../interfaces/Document';

const CreateDocument = () => {
    // Form state
    const [division, setDivision] = useState('');
    const [office, setOffice] = useState('');
    const [chargeToSpecify, setChargeToSpecify] = useState(false);
    const [fundSource, setFundSource] = useState('');
    const [saroNo, setSaroNo] = useState('');
    const [date, setDate] = useState('');
    const [reference, setReference] = useState('');
    const [prNo, setPrNo] = useState('');
    const [purpose, setPurpose] = useState('');

    // Requested by fields
    const [requestedByName, setRequestedByName] = useState('');
    const [requestedByDesignation, setRequestedByDesignation] = useState('');

    // Approved by fields
    const [approvedByName, setApprovedByName] = useState('');
    const [approvedByDesignation, setApprovedByDesignation] = useState('');

    // Items list
    const [items, setItems] = useState<PurchaseRequestItem[]>([
        {
            id: 1,
            stockPropertyNo: '',
            unit: '',
            itemDescription: '',
            quantity: '',
            unitCost: '',
            totalCost: 0
        }
    ]);

    // Helper functions
    const addItem = () => {
        const newItem = {
            id: items.length + 1,
            stockPropertyNo: '',
            unit: '',
            itemDescription: '',
            quantity: '',
            unitCost: '',
            totalCost: 0
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: number, field: string, value: string) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Calculate total cost when quantity or unit cost changes
                if (field === 'quantity' || field === 'unitCost') {
                    const quantity = parseFloat(field === 'quantity' ? value : updatedItem.quantity) || 0;
                    const unitCost = parseFloat(field === 'unitCost' ? value : updatedItem.unitCost) || 0;
                    updatedItem.totalCost = quantity * unitCost;
                }

                return updatedItem;
            }
            return item;
        }));
    };

    const calculateGrandTotal = () => {
        return items.reduce((total, item) => total + item.totalCost, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log('Purchase Request created:', {
            division,
            office,
            chargeToSpecify,
            fundSource,
            saroNo,
            date,
            reference,
            prNo,
            purpose,
            items,
            requestedBy: {
                name: requestedByName,
                designation: requestedByDesignation
            },
            approvedBy: {
                name: approvedByName,
                designation: approvedByDesignation
            },
            grandTotal: calculateGrandTotal()
        });
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <FileText className="w-8 h-8 text-green-600 mr-3" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Purchase Request</h1>
                            <p className="text-gray-600">Fill out the form below to create a new purchase request</p>
                        </div>
                    </div>
                </div>

                {/* Purchase Request Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-2">
                                Division *
                            </label>
                            <select
                                id="division"
                                value={division}
                                onChange={(e) => setDivision(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="">Select Division</option>
                                <option value="Administrative Division">Administrative Division</option>
                                <option value="Finance Division">Finance Division</option>
                                <option value="Technical Division">Technical Division</option>
                                <option value="Operations Division">Operations Division</option>
                                <option value="Human Resources Division">Human Resources Division</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="office" className="block text-sm font-medium text-gray-700 mb-2">
                                Office *
                            </label>
                            <select
                                id="office"
                                value={office}
                                onChange={(e) => setOffice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="">Select Office</option>
                                <option value="Main Office">Main Office</option>
                                <option value="Branch Office A">Branch Office A</option>
                                <option value="Branch Office B">Branch Office B</option>
                                <option value="Satellite Office">Satellite Office</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="chargeToSpecify"
                                checked={chargeToSpecify}
                                onChange={(e) => setChargeToSpecify(e.target.checked)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label htmlFor="chargeToSpecify" className="ml-2 block text-sm text-gray-700">
                                Charge to Specify
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="fundSource" className="block text-sm font-medium text-gray-700 mb-2">
                                Fund Source *
                            </label>
                            <select
                                id="fundSource"
                                value={fundSource}
                                onChange={(e) => setFundSource(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="">Select Fund Source</option>
                                <option value="General Fund">General Fund</option>
                                <option value="Special Fund">Special Fund</option>
                                <option value="Trust Fund">Trust Fund</option>
                                <option value="Development Fund">Development Fund</option>
                                <option value="Emergency Fund">Emergency Fund</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="saroNo" className="block text-sm font-medium text-gray-700 mb-2">
                                SARO No.
                            </label>
                            <input
                                type="text"
                                id="saroNo"
                                value={saroNo}
                                onChange={(e) => setSaroNo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Enter SARO number"
                            />
                        </div>

                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                                Date *
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="date"
                                    id="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                                Reference *
                            </label>
                            <select
                                id="reference"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="">Select Reference</option>
                                <option value="Annual Procurement Plan">Annual Procurement Plan</option>
                                <option value="Budget Allocation">Budget Allocation</option>
                                <option value="Emergency Procurement">Emergency Procurement</option>
                                <option value="Routine Operations">Routine Operations</option>
                                <option value="Special Project">Special Project</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="prNo" className="block text-sm font-medium text-gray-700 mb-2">
                                PR No.
                            </label>
                            <input
                                type="text"
                                id="prNo"
                                value={prNo}
                                onChange={(e) => setPrNo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Auto-generated or enter manually"
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">List of Items</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Item
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                            Stock/Property No.
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                            Unit
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Item Description
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                            Quantity
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                            Unit Cost
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                            Total Cost
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-3 py-4">
                                                <input
                                                    type="text"
                                                    value={item.stockPropertyNo}
                                                    onChange={(e) => updateItem(item.id, 'stockPropertyNo', e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                                    placeholder="Enter stock/property no."
                                                />
                                            </td>
                                            <td className="px-3 py-4">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                                    placeholder="Unit"
                                                />
                                            </td>
                                            <td className="px-3 py-4">
                                                <input
                                                    type="text"
                                                    value={item.itemDescription}
                                                    onChange={(e) => updateItem(item.id, 'itemDescription', e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                                    placeholder="Enter item description"
                                                />
                                            </td>
                                            <td className="px-3 py-4">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                                    placeholder="0"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="px-3 py-4">
                                                <input
                                                    type="number"
                                                    value={item.unitCost}
                                                    onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className="text-sm font-medium text-gray-900">
                                                    ₱{item.totalCost.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-600 hover:text-red-900 p-1"
                                                    disabled={items.length === 1}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={5} className="px-3 py-3 text-right text-sm font-medium text-gray-900">
                                            Grand Total:
                                        </td>
                                        <td className="px-3 py-3 text-sm font-bold text-gray-900">
                                            ₱{calculateGrandTotal().toFixed(2)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Purpose */}
                    <div>
                        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                            Purpose *
                        </label>
                        <textarea
                            id="purpose"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Provide the purpose of this purchase request..."
                            required
                        />
                    </div>

                    {/* Signatures Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t pt-6">
                        {/* Requested By */}
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-900">Requested by:</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Signature
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center h-24 flex items-center justify-center">
                                    <span className="text-sm text-gray-500">Digital signature area</span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="requestedByName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Printed Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        id="requestedByName"
                                        value={requestedByName}
                                        onChange={(e) => setRequestedByName(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="requestedByDesignation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Designation *
                                </label>
                                <select
                                    id="requestedByDesignation"
                                    value={requestedByDesignation}
                                    onChange={(e) => setRequestedByDesignation(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="">Select Designation</option>
                                    <option value="Department Head">Department Head</option>
                                    <option value="Division Chief">Division Chief</option>
                                    <option value="Section Chief">Section Chief</option>
                                    <option value="Supervisor">Supervisor</option>
                                    <option value="Officer">Officer</option>
                                    <option value="Staff">Staff</option>
                                </select>
                            </div>
                        </div>

                        {/* Approved By */}
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-900">Approved by:</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Signature
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center h-24 flex items-center justify-center">
                                    <span className="text-sm text-gray-500">Digital signature area</span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="approvedByName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Printed Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        id="approvedByName"
                                        value={approvedByName}
                                        onChange={(e) => setApprovedByName(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter full name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="approvedByDesignation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Designation
                                </label>
                                <select
                                    id="approvedByDesignation"
                                    value={approvedByDesignation}
                                    onChange={(e) => setApprovedByDesignation(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Select Designation</option>
                                    <option value="Director">Director</option>
                                    <option value="Assistant Director">Assistant Director</option>
                                    <option value="Department Head">Department Head</option>
                                    <option value="Division Chief">Division Chief</option>
                                    <option value="Finance Officer">Finance Officer</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                        <button
                            type="button"
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Create Purchase Request
                        </button>
                    </div>
                </form>
            </div>

            {/* Recent Purchase Requests Table */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Purchase Requests</h2>
                    <span className="text-sm text-gray-500">Last 10 requests</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    PR No.
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Division
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Office
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    PR-2025-001
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Administrative Division
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Main Office
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ₱25,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    July 15, 2025
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Approved
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-green-600 hover:text-green-900 mr-3">View</button>
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    PR-2025-002
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Technical Division
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Branch Office A
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ₱15,750.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    July 14, 2025
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        Pending
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-green-600 hover:text-green-900 mr-3">View</button>
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    PR-2025-003
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Finance Division
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Main Office
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ₱8,500.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    July 13, 2025
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                        Rejected
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-green-600 hover:text-green-900 mr-3">View</button>
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CreateDocument;
