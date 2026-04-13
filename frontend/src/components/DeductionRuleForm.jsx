import React, { useState, useEffect } from 'react';
import { createDeductionRule, getDeductionRules, updateDeductionRule, deleteDeductionRule } from '../services/api';
import './DeductionRuleForm.css';

export default function DeductionRuleForm() {
  const [rules, setRules] = useState([]);
  const [formData, setFormData] = useState({
    deductionType: '',
    percentage: '',
    fixedAmount: '',
    maxAmount: '',
    applicableFrom: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await getDeductionRules();
      setRules(response.data);
    } catch (err) {
      setError('Failed to fetch deduction rules');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingId) {
        await updateDeductionRule(editingId, formData);
      } else {
        await createDeductionRule(formData);
      }
      
      setFormData({
        deductionType: '',
        percentage: '',
        fixedAmount: '',
        maxAmount: '',
        applicableFrom: ''
      });
      setEditingId(null);
      fetchRules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save deduction rule');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule) => {
    setFormData({
      deductionType: rule.deductionType || '',
      percentage: rule.percentage || '',
      fixedAmount: rule.fixedAmount || '',
      maxAmount: rule.maxAmount || '',
      applicableFrom: rule.applicableFrom || ''
    });
    setEditingId(rule.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deduction rule?')) {
      try {
        await deleteDeductionRule(id);
        fetchRules();
      } catch (err) {
        setError('Failed to delete deduction rule');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      deductionType: '',
      percentage: '',
      fixedAmount: '',
      maxAmount: '',
      applicableFrom: ''
    });
    setEditingId(null);
  };

  return (
    <div className="deduction-rule-container">
      <div className="form-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h3>Manage Deduction Rules</h3>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-section">
        <h4>{editingId ? 'Edit Deduction Rule' : 'Add New Deduction Rule'}</h4>
        <form onSubmit={handleSubmit} className="deduction-form">
          <div className="form-group">
            <label>Deduction Type *</label>
            <input
              type="text"
              name="deductionType"
              value={formData.deductionType}
              onChange={handleInputChange}
              placeholder="e.g., Provident Fund, Professional Tax"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Percentage (%)</label>
              <input
                type="number"
                name="percentage"
                value={formData.percentage || ''}
                onChange={handleInputChange}
                placeholder="e.g., 12"
                step="0.01"
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Fixed Amount (')</label>
              <input
                type="number"
                name="fixedAmount"
                value={formData.fixedAmount || ''}
                onChange={handleInputChange}
                placeholder="e.g., 200"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Max Amount (')</label>
              <input
                type="number"
                name="maxAmount"
                value={formData.maxAmount || ''}
                onChange={handleInputChange}
                placeholder="e.g., 200"
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Applicable From</label>
              <input
                type="date"
                name="applicableFrom"
                value={formData.applicableFrom || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rules-section">
        <h4>Existing Deduction Rules</h4>
        {rules.length === 0 ? (
          <div className="no-data">
            <p>No deduction rules found. Create your first rule above.</p>
          </div>
        ) : (
          <div className="rules-grid">
            {rules.map((rule) => (
              <div key={rule.id} className="rule-card">
                <div className="rule-header">
                  <h5>{rule.deductionType}</h5>
                </div>
                <div className="rule-details">
                  <div className="detail-row">
                    <span className="detail-label">Deduction Type:</span>
                    <span className="detail-value">{rule.deductionType}</span>
                  </div>
                  {rule.percentage && (
                    <div className="detail-row">
                      <span className="detail-label">Percentage:</span>
                      <span className="detail-value">{rule.percentage}%</span>
                    </div>
                  )}
                  {rule.fixedAmount && (
                    <div className="detail-row">
                      <span className="detail-label">Fixed Amount:</span>
                      <span className="detail-value">₹{rule.fixedAmount}</span>
                    </div>
                  )}
                  {rule.maxAmount && (
                    <div className="detail-row">
                      <span className="detail-label">Max Amount:</span>
                      <span className="detail-value">₹{rule.maxAmount}</span>
                    </div>
                  )}
                  {rule.applicableFrom && (
                    <div className="detail-row">
                      <span className="detail-label">Applicable From:</span>
                      <span className="detail-value">{new Date(rule.applicableFrom).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="rule-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(rule)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(rule.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
