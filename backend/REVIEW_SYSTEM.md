# Review System Documentation

## Overview

The Review System allows patients to rate and review doctors after completed appointments. It includes features for detailed ratings, doctor responses, helpful votes, and content moderation.

---

## Features

- ✅ Star ratings (1-5 scale)
- ✅ Written reviews with comments
- ✅ Detailed sub-ratings (punctuality, communication, professionalism, facility)
- ✅ Doctor responses to reviews
- ✅ Helpful vote system
- ✅ Review reporting and moderation
- ✅ Automatic rating statistics calculation
- ✅ Rating distribution analytics
- ✅ Verified reviews (from completed appointments)

---

## API Endpoints

### Patient Endpoints

#### 1. Create Review

Submit a review for a completed appointment.

```http
POST /api/reviews
Authorization: Bearer <patient-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "appointmentId": "507f1f77bcf86cd799439011",
  "rating": 5,
  "comment": "Excellent doctor! Very professional and caring.",
  "punctuality": 5,
  "communication": 5,
  "professionalism": 5,
  "facilityRating": 4
}
```

**Required Fields:**
- `appointmentId` (string): Appointment ID
- `rating` (number): Overall rating (1-5)

**Optional Fields:**
- `comment` (string): Review text (max 1000 characters)
- `punctuality` (number): Punctuality rating (1-5)
- `communication` (number): Communication rating (1-5)
- `professionalism` (number): Professionalism rating (1-5)
- `facilityRating` (number): Facility rating (1-5)

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "appointmentId": "507f1f77bcf86cd799439011",
  "patientId": {
    "_id": "507f191e810c19729de860ea",
    "name": "John Doe"
  },
  "doctorId": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": {
      "name": "Dr. Jane Smith"
    }
  },
  "rating": 5,
  "comment": "Excellent doctor! Very professional and caring.",
  "punctuality": 5,
  "communication": 5,
  "professionalism": 5,
  "facilityRating": 4,
  "helpfulCount": 0,
  "isVerified": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
```json
// 404 - Appointment not found
{ "message": "Appointment not found" }

// 403 - Not authorized
{ "message": "Not authorized to review this appointment" }

// 400 - Not completed
{ "message": "Can only review completed appointments" }

// 400 - Already reviewed
{ "message": "You have already reviewed this appointment" }
```

---

#### 2. Update Review

Update your existing review.

```http
PUT /api/reviews/:id
Authorization: Bearer <patient-token>
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "rating": 4,
  "comment": "Updated my review after further reflection.",
  "punctuality": 4,
  "communication": 5,
  "professionalism": 5,
  "facilityRating": 4
}
```

---

#### 3. Delete Review

Delete your review.

```http
DELETE /api/reviews/:id
Authorization: Bearer <patient-token>
```

**Response:**
```json
{
  "message": "Review deleted successfully"
}
```

---

#### 4. Get My Reviews

Get all reviews you've written.

```http
GET /api/reviews/my-reviews
Authorization: Bearer <patient-token>
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "doctorId": {
      "userId": {
        "name": "Dr. Jane Smith"
      },
      "specialization": "Cardiology",
      "hospital": "City General Hospital"
    },
    "appointmentId": {
      "appointmentDate": "2024-01-10T00:00:00.000Z",
      "timeSlot": "10:00"
    },
    "rating": 5,
    "comment": "Excellent doctor!",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

#### 5. Check if Can Review

Check if you can review a specific appointment.

```http
GET /api/reviews/can-review/:appointmentId
Authorization: Bearer <patient-token>
```

**Response (Can Review):**
```json
{
  "canReview": true
}
```

**Response (Cannot Review):**
```json
{
  "canReview": false,
  "reason": "Appointment not completed yet"
}
```

**Response (Already Reviewed):**
```json
{
  "canReview": false,
  "reason": "Already reviewed",
  "reviewId": "507f1f77bcf86cd799439012"
}
```

---

### Public Endpoints

#### 6. Get Doctor Reviews

Get all reviews for a specific doctor with statistics.

```http
GET /api/reviews/doctor/:doctorId
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 10)
- `sortBy` (string): Sort field - `createdAt`, `rating`, `helpfulCount` (default: `createdAt`)
- `sortOrder` (string): `asc` or `desc` (default: `desc`)

**Example:**
```http
GET /api/reviews/doctor/507f1f77bcf86cd799439013?page=1&limit=10&sortBy=helpfulCount&sortOrder=desc
```

**Response:**
```json
{
  "reviews": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "patientId": {
        "name": "John Doe"
      },
      "rating": 5,
      "comment": "Excellent doctor! Very professional and caring.",
      "punctuality": 5,
      "communication": 5,
      "professionalism": 5,
      "facilityRating": 4,
      "helpfulCount": 12,
      "doctorResponse": {
        "comment": "Thank you for your kind words!",
        "respondedAt": "2024-01-16T10:00:00.000Z"
      },
      "isVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "statistics": {
    "averageRating": 4.7,
    "totalReviews": 45,
    "detailedRatings": {
      "punctuality": 4.6,
      "communication": 4.8,
      "professionalism": 4.9,
      "facility": 4.5
    },
    "ratingDistribution": {
      "5": 30,
      "4": 10,
      "3": 3,
      "2": 1,
      "1": 1
    }
  },
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
```

---

#### 7. Get Review by ID

Get a single review with full details.

```http
GET /api/reviews/:id
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "patientId": {
    "name": "John Doe"
  },
  "doctorId": {
    "userId": {
      "name": "Dr. Jane Smith"
    },
    "specialization": "Cardiology",
    "hospital": "City General Hospital"
  },
  "appointmentId": {
    "appointmentDate": "2024-01-10T00:00:00.000Z",
    "timeSlot": "10:00"
  },
  "rating": 5,
  "comment": "Excellent doctor!",
  "punctuality": 5,
  "communication": 5,
  "professionalism": 5,
  "facilityRating": 4,
  "helpfulCount": 12,
  "doctorResponse": {
    "comment": "Thank you!",
    "respondedAt": "2024-01-16T10:00:00.000Z"
  },
  "isVerified": true,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

#### 8. Mark Review as Helpful

Upvote a helpful review.

```http
POST /api/reviews/:id/helpful
```

**Response:**
```json
{
  "helpfulCount": 13
}
```

---

### Doctor Endpoints

#### 9. Respond to Review

Doctors can respond to reviews about them.

```http
POST /api/reviews/:id/respond
Authorization: Bearer <doctor-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "comment": "Thank you for your kind words! I'm glad I could help you."
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "rating": 5,
  "comment": "Excellent doctor!",
  "doctorResponse": {
    "comment": "Thank you for your kind words! I'm glad I could help you.",
    "respondedAt": "2024-01-16T10:00:00.000Z"
  },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Moderation Endpoints

#### 10. Report Review

Report inappropriate review content.

```http
POST /api/reviews/:id/report
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "This review contains false information about the doctor."
}
```

**Response:**
```json
{
  "message": "Review reported successfully. It will be reviewed by our team."
}
```

---

#### 11. Get Reported Reviews (Admin)

Get all reported reviews for moderation.

```http
GET /api/reviews/admin/reported
Authorization: Bearer <admin-token>
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "patientId": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "doctorId": {
      "userId": {
        "name": "Dr. Jane Smith",
        "email": "jane@hospital.com"
      }
    },
    "rating": 1,
    "comment": "Inappropriate content...",
    "isReported": true,
    "reportReason": "Contains false information",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

#### 12. Toggle Review Visibility (Admin)

Hide or unhide a review.

```http
PUT /api/reviews/:id/toggle-visibility
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "Review hidden",
  "review": {
    "_id": "507f1f77bcf86cd799439012",
    "isHidden": true
  }
}
```

---

## Rating System

### Overall Rating

- **Scale:** 1-5 stars
- **Required:** Yes
- **Displayed:** Prominently on doctor profiles

### Detailed Sub-Ratings

Optional detailed ratings for:

| Category | Description |
|----------|-------------|
| **Punctuality** | Doctor's timeliness |
| **Communication** | Clear explanation and listening |
| **Professionalism** | Bedside manner and conduct |
| **Facility** | Clinic/hospital environment |

---

## Statistics Calculation

### Average Rating

Automatically calculated from all non-hidden reviews:

```javascript
averageRating = sum(all ratings) / total reviews
// Rounded to 1 decimal place
```

### Rating Distribution

Shows how many reviews for each star level:

```json
{
  "5": 30,  // 30 five-star reviews
  "4": 10,  // 10 four-star reviews
  "3": 3,
  "2": 1,
  "1": 1
}
```

### Detailed Ratings Average

Average of each sub-rating category.

---

## Business Rules

### When Can Patients Review?

✅ **Can Review:**
- Appointment is completed
- Patient attended the appointment
- No existing review for this appointment

❌ **Cannot Review:**
- Appointment is pending, approved, cancelled, or rejected
- Patient already reviewed this appointment
- Not the patient's appointment

### Review Editing

- Patients can edit their reviews anytime
- Editing updates the doctor's average rating
- Edit history is not tracked (only current version stored)

### Review Deletion

- Patients can delete their own reviews
- Admins can delete any review
- Deletion recalculates doctor's statistics

### Doctor Responses

- Doctors can only respond to reviews about them
- One response per review
- Responses can be edited by updating the review
- Responses are public

---

## Content Moderation

### Reporting System

Users can report reviews for:
- False information
- Offensive language
- Spam
- Irrelevant content
- Personal attacks

### Admin Actions

Admins can:
- View all reported reviews
- Hide inappropriate reviews
- Unhide reviews after investigation
- Delete reviews permanently

### Hidden Reviews

- Not shown to public
- Not counted in rating statistics
- Still accessible to admin

---

## Frontend Integration

### React: Submit Review

```jsx
import { useState } from 'react';
import axios from 'axios';

function ReviewForm({ appointmentId, onSuccess }) {
  const [review, setReview] = useState({
    rating: 5,
    comment: '',
    punctuality: 5,
    communication: 5,
    professionalism: 5,
    facilityRating: 5,
  });

  const submitReview = async () => {
    try {
      const response = await axios.post('/api/reviews', {
        appointmentId,
        ...review,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Review submitted:', response.data);
      onSuccess();
    } catch (error) {
      console.error('Failed to submit review:', error.response.data.message);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submitReview(); }}>
      <div>
        <label>Overall Rating:</label>
        <StarRating
          value={review.rating}
          onChange={(rating) => setReview({...review, rating})}
        />
      </div>

      <div>
        <label>Punctuality:</label>
        <StarRating
          value={review.punctuality}
          onChange={(punctuality) => setReview({...review, punctuality})}
        />
      </div>

      {/* More sub-ratings... */}

      <textarea
        placeholder="Write your review..."
        value={review.comment}
        onChange={(e) => setReview({...review, comment: e.target.value})}
        maxLength={1000}
      />

      <button type="submit">Submit Review</button>
    </form>
  );
}
```

### React: Display Reviews

```jsx
function DoctorReviews({ doctorId }) {
  const [data, setData] = useState({ reviews: [], statistics: {}, pagination: {} });

  useEffect(() => {
    axios.get(`/api/reviews/doctor/${doctorId}?page=1&limit=10`)
      .then(res => setData(res.data));
  }, [doctorId]);

  return (
    <div>
      {/* Statistics */}
      <div className="stats">
        <h3>{data.statistics.averageRating} ★</h3>
        <p>{data.statistics.totalReviews} reviews</p>
        
        {/* Rating Distribution */}
        <RatingDistribution distribution={data.statistics.ratingDistribution} />
      </div>

      {/* Reviews List */}
      {data.reviews.map(review => (
        <ReviewCard key={review._id} review={review} />
      ))}

      {/* Pagination */}
      <Pagination
        current={data.pagination.page}
        total={data.pagination.pages}
        onChange={(page) => loadReviews(page)}
      />
    </div>
  );
}
```

---

## Database Schema

### Review Model

```javascript
{
  appointmentId: ObjectId (unique),
  patientId: ObjectId,
  doctorId: ObjectId,
  rating: Number (1-5),
  comment: String (max 1000 chars),
  punctuality: Number (1-5),
  communication: Number (1-5),
  professionalism: Number (1-5),
  facilityRating: Number (1-5),
  helpfulCount: Number,
  doctorResponse: {
    comment: String,
    respondedAt: Date
  },
  isVerified: Boolean,
  isReported: Boolean,
  reportReason: String,
  isHidden: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Fast queries for doctor reviews
{ doctorId: 1, createdAt: -1 }

// Patient's reviews
{ patientId: 1 }

// Prevent duplicate reviews
{ appointmentId: 1 } (unique)

// Filter by rating
{ rating: 1 }
```

---

## Best Practices

### For Patients

1. **Be Honest:** Provide constructive feedback
2. **Be Specific:** Mention what was good or bad
3. **Be Respectful:** Avoid personal attacks
4. **Review After Visit:** Write review while experience is fresh

### For Doctors

1. **Respond Professionally:** Thank patients for feedback
2. **Address Concerns:** Acknowledge issues raised
3. **Be Timely:** Respond within a few days
4. **Stay Positive:** Even for negative reviews

### For Admins

1. **Investigate Reports:** Review reported content carefully
2. **Be Fair:** Don't hide reviews without valid reason
3. **Communicate:** Inform users of moderation decisions
4. **Track Patterns:** Monitor for abuse

---

## Performance Tips

1. **Cache Statistics:** Cache average rating and counts on doctor model
2. **Paginate Results:** Always use pagination for reviews
3. **Index Properly:** Ensure database indexes are set
4. **Lazy Load:** Load reviews on demand, not with doctor profiles
5. **Background Jobs:** Calculate statistics asynchronously for high-traffic doctors

---

## Future Enhancements

- Photo uploads with reviews
- Review voting (upvote/downvote)
- Verified badges for appointments
- Doctor awards based on reviews
- Review templates for common feedback
- Sentiment analysis on comments
- Review reminders after appointments
- Public API for review aggregation
