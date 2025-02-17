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
            {/* Form fields remain the same */}
            {/* Add error messages for each field */}
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

            {/* Rest of the form fields follow the same pattern */}
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