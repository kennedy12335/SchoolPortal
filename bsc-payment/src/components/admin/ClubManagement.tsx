import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { config } from '../../config';
import { Club } from '../../types/types';

const ClubManagement: React.FC = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    capacity: '',
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/clubs/`);
      setClubs(response.data);
    } catch (error) {
      toast.error('Failed to fetch clubs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
    };

    try {
      if (editingClub) {
        await axios.put(`${config.apiUrl}/api/clubs/${editingClub.id}`, payload);
        toast.success('Club updated successfully');
      } else {
        await axios.post(`${config.apiUrl}/api/clubs/`, payload);
        toast.success('Club created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchClubs();
    } catch (error) {
      toast.error(editingClub ? 'Failed to update club' : 'Failed to create club');
      console.error(error);
    }
  };

  const handleDelete = async (clubId: number | string) => {
    if (!window.confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${config.apiUrl}/api/clubs/${clubId}`);
      toast.success('Club deleted successfully');
      fetchClubs();
    } catch (error) {
      toast.error('Failed to delete club');
      console.error(error);
    }
  };

  const openEditModal = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      description: club.description || '',
      price: club.price.toString(),
      capacity: club.capacity?.toString() || '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingClub(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      capacity: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Club Management</h2>
          <p className="text-gray-600">Manage clubs, membership fees, and capacities</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Club
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            No clubs found. Click "Add Club" to create one.
          </div>
        ) : (
          clubs.map((club) => (
            <div
              key={club.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{club.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(club)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(club.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {club.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{club.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Membership Fee:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(club.price)}</span>
                </div>
                {club.capacity && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Capacity:</span>
                    <span className="font-medium text-gray-700">{club.capacity} members</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate('/admin')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Back to Admin Dashboard
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingClub ? 'Edit Club' : 'Add New Club'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Chess Club, Drama Club"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Brief description of the club"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membership Fee (NGN) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 25000"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Maximum number of members"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for unlimited capacity
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingClub ? 'Update Club' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubManagement;
