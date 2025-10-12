import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Shield, UserX, Crown, Users } from 'lucide-react';

export default function OrganizationModal({ isOpen, onClose, organizationId }) {
  const [orgDetails, setOrgDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  // Fetch organization details
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchOrganizationDetails();
    }
  }, [isOpen, organizationId]);

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/organization/${organizationId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setOrgDetails(data);
      } else {
        console.error('Failed to fetch organization details');
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle invite member
  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      const response = await fetch(`http://localhost:3000/organization/${organizationId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setInviteEmail('');
        setInviteRole('member');
        // Show success message
        alert(result.message || 'Member invited successfully!');
        // Refresh organization details
        fetchOrganizationDetails();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to invite member');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to invite member. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Handle update member role
  const handleUpdateRole = async (memberId, newRole) => {
    try {
      const response = await fetch(
        `http://localhost:3000/organization/${organizationId}/members/${memberId}/role`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        alert('Member role updated successfully!');
        fetchOrganizationDetails();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    }
  };

  // Handle remove member
  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(
        `http://localhost:3000/organization/${organizationId}/members/${memberId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        alert('Member removed successfully!');
        fetchOrganizationDetails();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  if (!isOpen) return null;

  const isAdmin = orgDetails?.organization?.userRole === 'admin';
  
  // Debug logging
  console.log('Organization Details:', orgDetails);
  console.log('User Role:', orgDetails?.organization?.userRole);
  console.log('Is Admin:', isAdmin);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {loading ? 'Loading...' : orgDetails?.organization?.name || 'Organization'}
              </h2>
              <p className="text-indigo-100 text-sm">
                {isAdmin ? 'Admin View' : 'Member View'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Organization Info */}
              <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={18} className="text-indigo-600" />
                      <span className="font-semibold text-gray-800">
                        {orgDetails?.organization?.members?.length || 0} Members
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Your role: <span className="font-semibold text-indigo-600">{orgDetails?.organization?.userRole}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Invite Section - Admin Only */}
              {isAdmin && (
                <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200/50">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Mail size={18} className="text-green-600" />
                    Invite Members
                  </h3>
                  <form onSubmit={handleInviteMember} className="flex gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                    >
                      {inviting ? 'Sending...' : 'Invite'}
                    </button>
                  </form>
                </div>
              )}

              {/* Members Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Members</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Joined
                        </th>
                        {isAdmin && (
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orgDetails?.organization?.members?.map((member) => {
                        // Backend sends flattened member data, not nested under userId
                        const isOwner = member._id === orgDetails.organization.owner._id;
                        return (
                          <tr key={member._id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {member.picture ? (
                                  <img
                                    src={member.picture}
                                    alt={member.fullName || member.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                      {(member.fullName || member.username)
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {member.fullName || member.username}
                                  </p>
                                  {isOwner && (
                                    <span className="text-xs text-amber-600 flex items-center gap-1">
                                      <Crown size={12} />
                                      Owner
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {member.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isAdmin && !isOwner ? (
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateRole(member._id, e.target.value)}
                                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    member.role === 'admin'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {member.role}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {!isOwner && (
                                  <button
                                    onClick={() => handleRemoveMember(member._id)}
                                    className="text-red-600 hover:text-red-800 transition-colors duration-200 flex items-center gap-1 ml-auto"
                                  >
                                    <UserX size={16} />
                                    <span className="text-sm font-medium">Remove</span>
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Invitations - Admin Only */}
              {isAdmin && orgDetails?.organization?.invitations && orgDetails.organization.invitations.length > 0 && (
                <div className="mt-6 bg-amber-50 rounded-xl border border-amber-200/50 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Mail size={18} className="text-amber-600" />
                    Pending Invitations
                  </h3>
                  <div className="space-y-2">
                    {orgDetails.organization.invitations.map((invitation) => (
                      <div
                        key={invitation._id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{invitation.email}</p>
                          <p className="text-xs text-gray-500">
                            Role: {invitation.role} • Expires:{' '}
                            {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                          {invitation.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
