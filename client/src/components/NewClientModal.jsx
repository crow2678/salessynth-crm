import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar } from 'lucide-react';

const NewClientModal = ({ isOpen, onClose, onSave, client = null }) => {
  // Initial form state
  const initialFormState = {
    name: '',
    email: '',
    company: '',
    position: '',
    phone: '',
    notes: '',
    lastContact: '',
    followUpDate: '',
    deals: [],
    isActive: true
  };

  // Date formatting helper
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Form state
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Reset form when client prop changes
  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        lastContact: formatDate(client.lastContact),
        followUpDate: formatDate(client.followUpDate),
        deals: (client.deals || []).map(deal => ({
          ...deal,
          value: deal.value || 0,
          expectedCloseDate: formatDate(deal.expectedCloseDate)
        }))
      });
    } else {
      setFormData(initialFormState);
    }
    setFormErrors({});
  }, [client]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Validate deals
    formData.deals.forEach((deal, index) => {
      if (!deal.title.trim()) {
        errors[`deal_${index}_title`] = 'Deal title is required';
      }
      if (deal.value < 0) {
        errors[`deal_${index}_value`] = 'Value cannot be negative';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formattedData = {
      ...formData,
      lastContact: formData.lastContact ? new Date(formData.lastContact).toISOString() : null,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
      deals: formData.deals.map(deal => ({
        ...deal,
        value: parseFloat(deal.value) || 0,
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString() : null
      }))
    };

    onSave(formattedData);
    onClose();
  };

  // Deal management
  const addDeal = () => {
    setFormData(prev => ({
      ...prev,
      deals: [...prev.deals, {
        title: '',
        value: 0,
        status: 'prospecting',
        expectedCloseDate: ''
      }]
    }));
  };

  const updateDeal = (index, field, value) => {
    const updatedDeals = [...formData.deals];
    updatedDeals[index] = {
      ...updatedDeals[index],
      [field]: field === 'value' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({ ...prev, deals: updatedDeals }));
    
    // Clear any errors for this field
    if (formErrors[`deal_${index}_${field}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`deal_${index}_${field}`];
        return newErrors;
      });
    }
  };

  const removeDeal = (index) => {
    setFormData(prev => ({
      ...prev,
      deals: prev.deals.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (formErrors.name) {
                    setFormErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  ${formErrors.name ? 'border-red-500' : ''}`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  if (formErrors.email) {
                    setFormErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  ${formErrors.email ? 'border-red-500' : ''}`}
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">Active Client</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Contact
              </label>
              <input
                type="date"
                value={formData.lastContact}
                onChange={e => setFormData(prev => ({ ...prev, lastContact: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={e => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Deals Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Deals</h3>
              <button
                type="button"
                onClick={addDeal}
                className="flex items-center text-blue-600 hover:text-blue-700"
              >
                <Plus size={20} className="mr-1" />
                Add Deal
              </button>
            </div>

            <div className="space-y-4">
              {formData.deals.map((deal, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium">Deal {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeDeal(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deal Title
                      </label>
                      <input
                        type="text"
                        value={deal.title || ''}
                        onChange={e => updateDeal(index, 'title', e.target.value)}
                        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          ${formErrors[`deal_${index}_title`] ? 'border-red-500' : ''}`}
                      />
                      {formErrors[`deal_${index}_title`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`deal_${index}_title`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value
                      </label>
                      <input
                        type="number"
                        value={deal.value || ''}
                        onChange={e => updateDeal(index, 'value', e.target.value)}
                        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          ${formErrors[`deal_${index}_value`] ? 'border-red-500' : ''}`}
                        min="0"
                        step="0.01"
                      />
                      {formErrors[`deal_${index}_value`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`deal_${index}_value`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={deal.status || 'prospecting'}
                        onChange={e => updateDeal(index, 'status', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="prospecting">Prospecting</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="closed_won">Closed Won</option>
                        <option value="closed_lost">Closed Lost</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Close Date
                      </label>
                      <input
                        type="date"
                        value={deal.expectedCloseDate || ''}
                        onChange={e => updateDeal(index, 'expectedCloseDate', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {client ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewClientModal;