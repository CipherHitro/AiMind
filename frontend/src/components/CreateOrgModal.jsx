import React, { useState } from 'react';
import { X, Building2, Mail, Plus, Trash2 } from 'lucide-react';

export default function CreateOrgModal({ isOpen, onClose, onSuccess }) {
  const BASE_URL = import.meta.env.VITE_BASE_API_URL;
  const [orgName, setOrgName] = useState('');
  const [inviteEmails, setInviteEmails] = useState([{ email: '', role: 'member' }]);
  const [creating, setCreating] = useState(false);

  // Add email field
  const addEmailField = () => {
    setInviteEmails([...inviteEmails, { email: '', role: 'member' }]);
  };

  // Remove email field
  const removeEmailField = (index) => {
    const newEmails = inviteEmails.filter((_, i) => i !== index);
    setInviteEmails(newEmails);
  };

  // Update email field
  const updateEmailField = (index, field, value) => {
    const newEmails = [...inviteEmails];
    newEmails[index][field] = value;
    setInviteEmails(newEmails);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) {
      alert('Please enter an organization name');
      return;
    }

    try {
      setCreating(true);
      
      // Filter out empty emails
      const validEmails = inviteEmails
        .filter((invite) => invite.email.trim() !== '')
        .map((invite) => ({ email: invite.email.trim(), role: invite.role }));

      const response = await fetch(`${BASE_URL}/organization/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: orgName.trim(),
          inviteEmails: validEmails,
        }),
      });

      if (response.ok) {
        // Reset form
        setOrgName('');
        setInviteEmails([{ email: '', role: 'member' }]);
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
        
        // Close modal
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Organization</h2>
              <p className="text-indigo-100 text-sm">Set up a new organization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {/* Organization Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter organization name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Invite Members Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Invite Members (Optional)
            </label>
            <div className="space-y-3">
              {inviteEmails.map((invite, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={invite.email}
                      onChange={(e) => updateEmailField(index, 'email', e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <select
                    value={invite.role}
                    onChange={(e) => updateEmailField(index, 'role', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  {inviteEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEmailField}
              className="mt-3 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors duration-200"
            >
              <Plus size={16} />
              Add another email
            </button>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You will be automatically assigned as the admin of this organization.
              Members can be invited now or added later.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold shadow-lg"
            >
              {creating ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
