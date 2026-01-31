import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { config } from '../../config';
import { Exam } from '../../types/types';

// Use enum names as values so the frontend stores and displays backend-compatible values
const YEAR_OPTIONS = [
  { label: 'Year 7', value: 'YEAR_7' },
  { label: 'Year 8', value: 'YEAR_8' },
  { label: 'Year 9', value: 'YEAR_9' },
  { label: 'Year 10', value: 'YEAR_10' },
  { label: 'Year 11', value: 'YEAR_11' },
  { label: 'Year 12', value: 'YEAR_12' },
];

const ExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    exam_name: '',
    amount: '',
    extra_fees: '',
    extra_fees_name: '',
    allows_installments: false,
    applicable_grades: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/exams/get-all-exams`);
      setExams(response.data);
    } catch (error) {
      toast.error('Failed to fetch exams');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(editingExam ? 'Updating exam and associating students...' : 'Associating students with the exam...');

    const payload = {
      exam_name: formData.exam_name,
      amount: parseFloat(formData.amount),
      extra_fees: formData.extra_fees ? parseFloat(formData.extra_fees) : 0,
      extra_fees_name: formData.extra_fees_name || null,
      allows_installments: formData.allows_installments,
      applicable_grades: formData.applicable_grades.length > 0 ? formData.applicable_grades : null,
    };

    try {
      if (editingExam) {
        await axios.put(`${config.apiUrl}/api/exams/update-exam`, {
          id: editingExam.id,
          ...payload,
        });
        toast.success('Exam updated successfully');
      } else {
        await axios.post(`${config.apiUrl}/api/exams/create-exam`, payload);
        toast.success('Exam created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchExams();
    } catch (error) {
      toast.error(editingExam ? 'Failed to update exam' : 'Failed to create exam');
      console.error(error);
    } finally {
      setSubmitting(false);
      setSubmitMessage('');
    }
  }; 

  const handleDelete = async (examId: string) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${config.apiUrl}/api/exams/delete-exam/${examId}`);
      toast.success('Exam deleted successfully');
      fetchExams();
    } catch (error) {
      toast.error('Failed to delete exam');
      console.error(error);
    }
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      exam_name: exam.exam_name,
      amount: exam.amount.toString(),
      extra_fees: exam.extra_fees?.toString() || '',
      extra_fees_name: exam.extra_fees_name || '',
      allows_installments: exam.allows_installments,
      applicable_grades: exam.applicable_grades ?? [],
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingExam(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      exam_name: '',
      amount: '',
      extra_fees: '',
      extra_fees_name: '',
      allows_installments: false,
      applicable_grades: [],
    });
  };

  const handleYearToggle = (year: string) => {
    setFormData((prev) => ({
      ...prev,
      applicable_grades: prev.applicable_grades.includes(year)
        ? prev.applicable_grades.filter((y) => y !== year)
        : [...prev.applicable_grades, year],
    }));
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
          <h2 className="text-2xl font-bold text-gray-800">Exam Management</h2>
          <p className="text-gray-600">Manage exams, prices, and applicable year groups</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Exam
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exam Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extra Fees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extra Fees Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Installments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applicable Years
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No exams found. Click "Add Exam" to create one.
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{exam.exam_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(exam.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {exam.extra_fees ? formatCurrency(exam.extra_fees) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {exam.extra_fees_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        exam.allows_installments
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {exam.allows_installments ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {exam.applicable_grades && exam.applicable_grades.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {exam.applicable_grades.map((year) => (
                            <span
                              key={year}
                              className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {year.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">All Years</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(exam)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingExam ? 'Edit Exam' : 'Add New Exam'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.exam_name}
                  onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., IGCSE, Checkpoint, SAT"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (NGN) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 150000"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extra Fees (NGN)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.extra_fees}
                  onChange={(e) => setFormData({ ...formData, extra_fees: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional extra fees"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extra Fees Name
                </label>
                <input
                  type="text"
                  value={formData.extra_fees_name}
                  onChange={(e) => setFormData({ ...formData, extra_fees_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Study Materials, Registration Fee"
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allows_installments}
                    onChange={(e) => setFormData({ ...formData, allows_installments: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Allow Installment Payments
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  If enabled, students can pay for this exam in multiple installments
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Year Groups
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Select the year groups this exam applies to. Leave empty for all years.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {YEAR_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-center px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        formData.applicable_grades.includes(opt.value)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.applicable_grades.includes(opt.value)}
                        onChange={() => handleYearToggle(opt.value)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {submitMessage && (
                  <div className="text-sm text-gray-700 flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>{submitMessage}</span>
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        {editingExam ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (
                      editingExam ? 'Update Exam' : 'Create Exam'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
