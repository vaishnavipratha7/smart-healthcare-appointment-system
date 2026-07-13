# Doctor Search & Filter API Documentation

## Overview

The Doctor Search API provides comprehensive filtering, searching, and sorting capabilities for finding healthcare providers. All endpoints are public (no authentication required) to allow patients to browse doctors before registering.

---

## Endpoints

### 1. Simple Doctor List

Get all approved and active doctors.

```http
GET /api/doctor/list
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": {
      "_id": "507f191e810c19729de860ea",
      "name": "Dr. John Smith",
      "email": "john.smith@hospital.com",
      "phone": "1234567890"
    },
    "specialization": "Cardiology",
    "hospital": "City General Hospital",
    "qualification": "MD, FACC",
    "experience": 15,
    "consultationFee": 150,
    "availableSlots": [
      {
        "day": "Monday",
        "times": ["09:00", "09:30", "10:00", "10:30"]
      }
    ],
    "status": "approved",
    "isActive": true
  }
]
```

---

### 2. Advanced Search

Search and filter doctors with multiple criteria.

```http
GET /api/doctor/search
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search by doctor name or hospital | `?search=john` |
| `specialization` | string | Filter by specialization (partial match) | `?specialization=cardio` |
| `hospital` | string | Filter by hospital (partial match) | `?hospital=general` |
| `minFee` | number | Minimum consultation fee | `?minFee=100` |
| `maxFee` | number | Maximum consultation fee | `?maxFee=200` |
| `minExperience` | number | Minimum years of experience | `?minExperience=10` |
| `availableDay` | string | Filter by available day | `?availableDay=Monday` |
| `availableTime` | string | Filter by available time slot | `?availableTime=09:00` |
| `sortBy` | string | Sort field: `fee`, `experience`, `name` | `?sortBy=experience` |
| `sortOrder` | string | Sort order: `asc` or `desc` | `?sortOrder=desc` |
| `page` | number | Page number (default: 1) | `?page=1` |
| `limit` | number | Results per page (default: 10) | `?limit=20` |

**Example Requests:**

1. **Find cardiologists:**
```http
GET /api/doctor/search?specialization=cardiology
```

2. **Find doctors at specific hospital:**
```http
GET /api/doctor/search?hospital=City%20General
```

3. **Find doctors with fee range:**
```http
GET /api/doctor/search?minFee=50&maxFee=150
```

4. **Find experienced cardiologists, sorted by fee:**
```http
GET /api/doctor/search?specialization=cardiology&minExperience=10&sortBy=fee&sortOrder=asc
```

5. **Find doctors available on Monday at 10:00:**
```http
GET /api/doctor/search?availableDay=Monday&availableTime=10:00
```

6. **Search by name:**
```http
GET /api/doctor/search?search=john%20smith
```

7. **Complex search with pagination:**
```http
GET /api/doctor/search?specialization=cardiology&hospital=general&minFee=100&maxFee=200&sortBy=experience&sortOrder=desc&page=1&limit=10
```

**Response:**
```json
{
  "doctors": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": {
        "_id": "507f191e810c19729de860ea",
        "name": "Dr. John Smith",
        "email": "john.smith@hospital.com",
        "phone": "1234567890"
      },
      "specialization": "Cardiology",
      "hospital": "City General Hospital",
      "qualification": "MD, FACC",
      "experience": 15,
      "consultationFee": 150,
      "availableSlots": [...],
      "status": "approved",
      "isActive": true
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3,
    "limit": 10
  }
}
```

---

### 3. Get Specializations

Get a list of all unique specializations.

```http
GET /api/doctor/specializations
```

**Response:**
```json
[
  "Cardiology",
  "Dermatology",
  "General Medicine",
  "Neurology",
  "Orthopedics",
  "Pediatrics"
]
```

**Use Case:** Populate dropdown menus in search filters.

---

### 4. Get Hospitals

Get a list of all unique hospitals.

```http
GET /api/doctor/hospitals
```

**Response:**
```json
[
  "City General Hospital",
  "Memorial Medical Center",
  "St. Mary's Hospital",
  "University Hospital"
]
```

**Use Case:** Populate dropdown menus in search filters.

---

### 5. Get Doctor by ID

Get detailed information about a specific doctor.

```http
GET /api/doctor/:id
```

**Parameters:**
- `id` (path parameter): Doctor's MongoDB ObjectId

**Example:**
```http
GET /api/doctor/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": {
    "_id": "507f191e810c19729de860ea",
    "name": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    "phone": "1234567890"
  },
  "specialization": "Cardiology",
  "hospital": "City General Hospital",
  "qualification": "MD, FACC",
  "experience": 15,
  "consultationFee": 150,
  "availableSlots": [
    {
      "day": "Monday",
      "times": ["09:00", "09:30", "10:00", "10:30", "11:00"]
    },
    {
      "day": "Tuesday",
      "times": ["09:00", "09:30", "10:00", "10:30"]
    }
  ],
  "certificates": [
    {
      "filename": "cert_12345.pdf",
      "originalName": "Medical License.pdf",
      "uploadDate": "2024-01-01T00:00:00.000Z"
    }
  ],
  "profilePicture": "profile_12345.jpg",
  "status": "approved",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z"
}
```

**Error Responses:**
```json
// 404 - Not found
{
  "message": "Doctor not found"
}

// 404 - Not available
{
  "message": "Doctor not available"
}
```

---

### 6. Check Doctor Availability

Check if a doctor is available for a specific date and time.

```http
GET /api/doctor/:id/availability
```

**Query Parameters:**
- `date` (required): ISO date string (YYYY-MM-DD)
- `timeSlot` (required): Time slot (HH:MM format)

**Example:**
```http
GET /api/doctor/507f1f77bcf86cd799439011/availability?date=2024-02-15&timeSlot=10:00
```

**Response (Available):**
```json
{
  "available": true,
  "doctor": {
    "name": "Dr. John Smith",
    "specialization": "Cardiology",
    "hospital": "City General Hospital"
  }
}
```

**Response (Not Available - Not in Schedule):**
```json
{
  "available": false,
  "reason": "Doctor is not available at this time"
}
```

**Response (Not Available - Already Booked):**
```json
{
  "available": false,
  "reason": "This time slot is already booked"
}
```

**Error Responses:**
```json
// 400 - Missing parameters
{
  "message": "Please provide date and timeSlot"
}

// 404 - Doctor not found
{
  "message": "Doctor not found"
}
```

---

## Search Features Explained

### Text Search

The `search` parameter performs a case-insensitive search across:
- Doctor names
- Hospital names

**Example:**
```
?search=john
```
Matches:
- "Dr. John Smith"
- "Dr. Johnny Doe"
- "St. John's Hospital"

---

### Partial Matching

Specialization and hospital filters support partial, case-insensitive matching:

```
?specialization=cardio
```
Matches:
- "Cardiology"
- "Pediatric Cardiology"
- "Interventional Cardiology"

---

### Range Filters

Fee and experience filters support minimum and maximum values:

```
?minFee=100&maxFee=200
```
Returns doctors with fees between $100 and $200.

```
?minExperience=10
```
Returns doctors with 10+ years of experience.

---

### Availability Filters

Filter by specific days and times:

**Available Days:**
- Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

**Time Slots:**
- Format: HH:MM (24-hour)
- Example: 09:00, 14:30, 16:00

```
?availableDay=Monday&availableTime=10:00
```
Returns only doctors available on Mondays at 10:00 AM.

---

### Sorting

Sort results by different fields:

| Sort By | Description |
|---------|-------------|
| `fee` | Consultation fee (low to high or high to low) |
| `experience` | Years of experience |
| `name` | Doctor's name (alphabetical) |

**Examples:**
```
?sortBy=fee&sortOrder=asc        # Cheapest first
?sortBy=experience&sortOrder=desc # Most experienced first
?sortBy=name&sortOrder=asc       # Alphabetical A-Z
```

---

### Pagination

Control the number of results and pages:

```
?page=1&limit=10    # First 10 results
?page=2&limit=20    # Results 21-40
```

**Pagination Response:**
```json
{
  "pagination": {
    "total": 45,      // Total matching doctors
    "page": 1,        // Current page
    "pages": 5,       // Total pages (45/10 = 5)
    "limit": 10       // Results per page
  }
}
```

---

## Frontend Integration Examples

### React: Search Form

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function DoctorSearch() {
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    hospital: '',
    minFee: '',
    maxFee: '',
    availableDay: '',
    sortBy: 'name',
    page: 1,
  });
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({});
  const [specializations, setSpecializations] = useState([]);

  // Load specializations on mount
  useEffect(() => {
    axios.get('/api/doctor/specializations')
      .then(res => setSpecializations(res.data));
  }, []);

  // Search doctors
  const searchDoctors = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`/api/doctor/search?${params}`);
      setDoctors(response.data.doctors);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  useEffect(() => {
    searchDoctors();
  }, [filters]);

  return (
    <div>
      <input
        placeholder="Search by name or hospital"
        value={filters.search}
        onChange={(e) => setFilters({...filters, search: e.target.value})}
      />
      
      <select
        value={filters.specialization}
        onChange={(e) => setFilters({...filters, specialization: e.target.value})}
      >
        <option value="">All Specializations</option>
        {specializations.map(spec => (
          <option key={spec} value={spec}>{spec}</option>
        ))}
      </select>

      {/* Render doctors */}
      {doctors.map(doctor => (
        <DoctorCard key={doctor._id} doctor={doctor} />
      ))}

      {/* Pagination */}
      <Pagination
        current={pagination.page}
        total={pagination.pages}
        onChange={(page) => setFilters({...filters, page})}
      />
    </div>
  );
}
```

### JavaScript: Check Availability

```javascript
async function checkAvailability(doctorId, date, timeSlot) {
  try {
    const response = await fetch(
      `/api/doctor/${doctorId}/availability?date=${date}&timeSlot=${timeSlot}`
    );
    const data = await response.json();
    
    if (data.available) {
      console.log('✅ Doctor is available!');
      // Enable booking button
    } else {
      console.log('❌ Not available:', data.reason);
      // Show error message
    }
  } catch (error) {
    console.error('Check failed:', error);
  }
}

// Usage
checkAvailability('507f1f77bcf86cd799439011', '2024-02-15', '10:00');
```

---

## Performance Considerations

### Indexes

Ensure MongoDB indexes on frequently queried fields:

```javascript
// In Doctor model
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ experience: 1 });
doctorSchema.index({ 'availableSlots.day': 1 });
doctorSchema.index({ status: 1, isActive: 1 });
```

### Caching

Consider caching for:
- Specializations list (changes infrequently)
- Hospitals list (changes infrequently)
- Popular search results

### Optimization Tips

1. Use pagination for large result sets
2. Limit text search to indexed fields
3. Cache dropdown options (specializations, hospitals)
4. Implement debouncing on search input (frontend)
5. Add loading states for better UX

---

## Common Use Cases

### 1. Find Nearby Cardiologists
```http
GET /api/doctor/search?specialization=cardiology&sortBy=fee&sortOrder=asc
```

### 2. Find Affordable Doctors
```http
GET /api/doctor/search?maxFee=100&sortBy=experience&sortOrder=desc
```

### 3. Find Weekend Availability
```http
GET /api/doctor/search?availableDay=Saturday
```

### 4. Search by Name
```http
GET /api/doctor/search?search=smith
```

### 5. Filter by Hospital
```http
GET /api/doctor/search?hospital=general&page=1&limit=20
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful request
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "message": "Error description"
}
```

---

## Testing

### cURL Examples

```bash
# Search for cardiologists
curl "http://localhost:5000/api/doctor/search?specialization=cardiology"

# Check availability
curl "http://localhost:5000/api/doctor/507f1f77bcf86cd799439011/availability?date=2024-02-15&timeSlot=10:00"

# Get specializations
curl "http://localhost:5000/api/doctor/specializations"
```

### Postman Collection

Import these requests into Postman for easy testing:
1. Search Doctors (with various filters)
2. Get Specializations
3. Get Hospitals
4. Get Doctor by ID
5. Check Availability

---

## Future Enhancements

Potential improvements:
- Geolocation-based search (find doctors near me)
- Doctor ratings and reviews integration
- Real-time availability updates via WebSocket
- Advanced filtering (insurance accepted, languages spoken)
- Fuzzy search for typo tolerance
- Search history and saved searches
- Doctor comparison feature
