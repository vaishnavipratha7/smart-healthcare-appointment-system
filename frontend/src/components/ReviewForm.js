import React, { useState } from 'react';
import axios from 'axios';

const ReviewForm = ({ appointmentId, doctorId, onReviewSubmitted }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    subRatings: {
      punctuality: 5,
      communication: 5,
      professionalism: 5,
      facility: 5,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRatingChange = (field, value) => {
    if (field === 'rating') {
      setFormData((prev) => ({ ...prev, rating: value }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subRatings: { ...prev.subRatings, [field]: value },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reviews`,
        {
          appointmentId,
          doctorId,
          ...formData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (onReviewSubmitted) {
        onReviewSubmitted(response.data.review);
      }

      // Reset form
      setFormData({
        rating: 5,
        comment: '',
        subRatings: {
          punctuality: 5,
          communication: 5,
          professionalism: 5,
          facility: 5,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStarInput = (label, field, value) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(field, star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= value ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-gray-700">{value}/5</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Write a Review
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Overall Rating */}
        {renderStarInput('Overall Rating', 'rating', formData.rating)}

        {/* Sub Ratings */}
        <div className="mt-6 mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Detailed Ratings
          </h4>
          <div className="space-y-3">
            {renderStarInput(
              'Punctuality',
              'punctuality',
              formData.subRatings.punctuality
            )}
            {renderStarInput(
              'Communication',
              'communication',
              formData.subRatings.communication
            )}
            {renderStarInput(
              'Professionalism',
              'professionalism',
              formData.subRatings.professionalism
            )}
            {renderStarInput(
              'Facility Quality',
              'facility',
              formData.subRatings.facility
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, comment: e.target.value }))
            }
            rows={4}
            maxLength={1000}
            placeholder="Share your experience with this doctor..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="mt-1 text-right text-sm text-gray-500">
            {formData.comment.length}/1000 characters
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.comment.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
