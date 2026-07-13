import React, { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const ReviewCard = ({ review, currentUserId, isDoctor = false, onUpdate }) => {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleHelpful = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reviews/${review._id}/helpful`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const handleResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reviews/${review._id}/response`,
        { response: responseText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponseText('');
      setShowResponseForm(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reviews/${review._id}/report`,
        { reason: reportReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportReason('');
      setIsReporting(false);
      alert('Review reported successfully. Our team will review it.');
    } catch (error) {
      console.error('Error reporting review:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const renderSubRatings = () => {
    if (!review.subRatings) return null;

    const subRatingLabels = {
      punctuality: 'Punctuality',
      communication: 'Communication',
      professionalism: 'Professionalism',
      facility: 'Facility',
    };

    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {Object.entries(review.subRatings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{subRatingLabels[key]}:</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3 h-3 ${
                    star <= value ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
            {review.patientId?.name?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div className="ml-3">
            <h4 className="font-semibold text-gray-900">
              {review.patientId?.name || 'Anonymous'}
            </h4>
            <p className="text-sm text-gray-500">
              {review.createdAt
                ? format(new Date(review.createdAt), 'MMM dd, yyyy')
                : 'Recently'}
            </p>
          </div>
        </div>

        {/* Verified Badge */}
        {review.appointmentId && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Verified Patient
          </span>
        )}
      </div>

      {/* Rating */}
      <div className="mb-3">{renderStars(review.rating)}</div>

      {/* Sub Ratings */}
      {renderSubRatings()}

      {/* Comment */}
      <p className="text-gray-700 mt-3 leading-relaxed">{review.comment}</p>

      {/* Doctor Response */}
      {review.doctorResponse && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="font-semibold text-gray-900">Doctor's Response</p>
              <p className="text-gray-700 mt-1">{review.doctorResponse.text}</p>
              <p className="text-sm text-gray-500 mt-1">
                {review.doctorResponse.respondedAt
                  ? format(
                      new Date(review.doctorResponse.respondedAt),
                      'MMM dd, yyyy'
                    )
                  : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Helpful Button */}
          {!isDoctor && currentUserId !== review.patientId?._id && (
            <button
              onClick={handleHelpful}
              className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              Helpful ({review.helpfulCount || 0})
            </button>
          )}

          {/* Response Button for Doctor */}
          {isDoctor && !review.doctorResponse && (
            <button
              onClick={() => setShowResponseForm(!showResponseForm)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              Respond
            </button>
          )}
        </div>

        {/* Report Button */}
        {!isDoctor && currentUserId !== review.patientId?._id && (
          <button
            onClick={() => setIsReporting(!isReporting)}
            className="text-sm text-red-600 hover:text-red-800 transition"
          >
            Report
          </button>
        )}
      </div>

      {/* Response Form */}
      {showResponseForm && (
        <form onSubmit={handleResponse} className="mt-4">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Write your response..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {responseText.length}/500 characters
            </span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setShowResponseForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !responseText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Response'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Report Form */}
      {isReporting && (
        <form onSubmit={handleReport} className="mt-4 p-4 bg-red-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Reason for reporting
          </label>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Please explain why you're reporting this review..."
            rows={3}
            className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsReporting(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reportReason.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md disabled:opacity-50"
            >
              {loading ? 'Reporting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReviewCard;
