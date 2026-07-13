# File Upload System Documentation

## Overview

The Healthcare Appointment System includes a secure file upload system for handling:
- Doctor certificates (medical degrees, licenses)
- Patient medical records (X-rays, reports, prescriptions)
- Profile pictures (for doctors and patients)

## Features

- ✅ Secure file upload with validation
- ✅ File type restrictions
- ✅ File size limits (10MB per file)
- ✅ Automatic file organization
- ✅ Multiple file upload support
- ✅ File deletion with cleanup
- ✅ Access control (role-based)

---

## Directory Structure

```
backend/
└── uploads/
    ├── certificates/          # Doctor certificates
    ├── medical-records/       # Patient medical records
    └── profile-pictures/      # User profile pictures
```

**Note:** Upload directories are created automatically on server start.

---

## API Endpoints

### 1. Doctor Certificates

#### Upload Certificate
```http
POST /api/upload/doctor/certificate
Authorization: Bearer <token>
Content-Type: multipart/form-data
Role: doctor

Body (form-data):
- certificate: <file>

Allowed formats: PDF, DOC, DOCX, JPEG, JPG, PNG
Max size: 10MB
```

**Response:**
```json
{
  "message": "Certificate uploaded successfully",
  "certificate": {
    "filename": "userId_timestamp_filename.pdf",
    "originalName": "medical_degree.pdf",
    "fileType": "application/pdf",
    "fileSize": 2048576,
    "uploadDate": "2024-01-15T10:30:00.000Z",
    "url": "/uploads/certificates/userId_timestamp_filename.pdf"
  }
}
```

#### Get All Certificates
```http
GET /api/upload/doctor/certificates
Authorization: Bearer <token>
Role: doctor
```

**Response:**
```json
[
  {
    "filename": "userId_timestamp_filename.pdf",
    "originalName": "medical_degree.pdf",
    "fileType": "application/pdf",
    "fileSize": 2048576,
    "uploadDate": "2024-01-15T10:30:00.000Z",
    "url": "/uploads/certificates/userId_timestamp_filename.pdf"
  }
]
```

#### Delete Certificate
```http
DELETE /api/upload/doctor/certificate/:filename
Authorization: Bearer <token>
Role: doctor
```

---

### 2. Profile Pictures

#### Upload Profile Picture
```http
POST /api/upload/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body (form-data):
- profilePicture: <file>

Allowed formats: JPEG, JPG, PNG, GIF, WebP
Max size: 10MB
```

**Response:**
```json
{
  "message": "Profile picture uploaded successfully",
  "profilePicture": {
    "filename": "userId_timestamp_photo.jpg",
    "url": "/uploads/profile-pictures/userId_timestamp_photo.jpg"
  }
}
```

---

### 3. Medical Records (Appointments)

#### Upload Single Medical Record
```http
POST /api/upload/appointment/:appointmentId/medical-record
Authorization: Bearer <token>
Content-Type: multipart/form-data
Role: patient or doctor (for their appointments)

Body (form-data):
- medicalRecord: <file>

Allowed formats: PDF, JPEG, JPG, PNG, DCM (DICOM)
Max size: 10MB
```

**Response:**
```json
{
  "message": "Medical record uploaded successfully",
  "medicalRecord": {
    "filename": "userId_timestamp_xray.jpg",
    "originalName": "chest_xray.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000,
    "uploadDate": "2024-01-15T10:30:00.000Z",
    "uploadedBy": "patient",
    "url": "/uploads/medical-records/userId_timestamp_xray.jpg"
  }
}
```

#### Upload Multiple Medical Records
```http
POST /api/upload/appointment/:appointmentId/medical-records
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body (form-data):
- medicalRecord: <file> (multiple files, max 5)

Max 5 files per request
```

**Response:**
```json
{
  "message": "3 medical record(s) uploaded successfully",
  "medicalRecords": [
    {
      "filename": "userId_timestamp_file1.jpg",
      "originalName": "xray1.jpg",
      "fileType": "image/jpeg",
      "fileSize": 1024000,
      "uploadDate": "2024-01-15T10:30:00.000Z",
      "uploadedBy": "patient",
      "url": "/uploads/medical-records/userId_timestamp_file1.jpg"
    }
  ]
}
```

#### Get Medical Records for Appointment
```http
GET /api/upload/appointment/:appointmentId/medical-records
Authorization: Bearer <token>
Role: patient or doctor (for their appointments)
```

#### Delete Medical Record
```http
DELETE /api/upload/appointment/:appointmentId/medical-record/:filename
Authorization: Bearer <token>
Role: patient or doctor (for their appointments)
```

---

## File Naming Convention

Files are automatically renamed using the pattern:
```
{userId}_{timestamp}_{sanitizedOriginalName}.{extension}
```

**Example:**
- Original: `My Medical Degree (2024).pdf`
- Stored as: `507f1f77bcf86cd799439011_1705315800000_My_Medical_Degree_2024.pdf`

This ensures:
- Unique filenames (no collisions)
- Traceable uploads (includes userId and timestamp)
- No special characters (prevents path traversal)

---

## File Validation

### File Type Restrictions

| Category | Allowed Types |
|----------|--------------|
| **Certificates** | PDF, DOC, DOCX, JPEG, JPG, PNG, GIF, WebP |
| **Medical Records** | PDF, JPEG, JPG, PNG, DCM (DICOM) |
| **Profile Pictures** | JPEG, JPG, PNG, GIF, WebP |

### File Size Limits

- Maximum file size: **10MB per file**
- Multiple uploads: **10MB per file** (max 5 files)

### Security Measures

1. **MIME type validation** - Checks actual file content, not just extension
2. **Extension validation** - Verifies file extension matches allowed types
3. **Size limits** - Prevents large file attacks
4. **Path sanitization** - Prevents directory traversal
5. **Access control** - Role-based permissions
6. **Automatic cleanup** - Deletes files on error

---

## Access Control

### Doctor Certificates
- **Upload**: Doctor only (their own profile)
- **View**: Doctor only (their own certificates)
- **Delete**: Doctor only (their own certificates)

### Profile Pictures
- **Upload**: All authenticated users
- **View**: Public (via URL)
- **Delete**: Automatically replaced on new upload

### Medical Records
- **Upload**: Patient (their appointments) or Doctor (their appointments)
- **View**: Patient or Doctor (only for their appointments)
- **Delete**: Patient or Doctor (only for their appointments)

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "message": "File too large. Maximum size is 10MB"
}
```

**400 Bad Request**
```json
{
  "message": "Certificates must be PDF, DOC, DOCX, or image files"
}
```

**403 Forbidden**
```json
{
  "message": "Not authorized to upload files for this appointment"
}
```

**404 Not Found**
```json
{
  "message": "Appointment not found"
}
```

---

## Frontend Integration

### Example: Upload Doctor Certificate (React)

```javascript
const uploadCertificate = async (file) => {
  const formData = new FormData();
  formData.append('certificate', file);

  try {
    const response = await fetch('/api/upload/doctor/certificate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log('Upload successful:', data);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Example: Upload Multiple Medical Records

```javascript
const uploadMedicalRecords = async (appointmentId, files) => {
  const formData = new FormData();
  
  // Add multiple files with the same field name
  files.forEach((file) => {
    formData.append('medicalRecord', file);
  });

  try {
    const response = await fetch(
      `/api/upload/appointment/${appointmentId}/medical-records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();
    console.log('Upload successful:', data);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Example: Display Uploaded Image

```jsx
<img 
  src={`${API_URL}${certificate.url}`} 
  alt={certificate.originalName}
/>
```

---

## Testing

### Using cURL

**Upload Certificate:**
```bash
curl -X POST http://localhost:5000/api/upload/doctor/certificate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "certificate=@/path/to/certificate.pdf"
```

**Upload Multiple Files:**
```bash
curl -X POST http://localhost:5000/api/upload/appointment/APPOINTMENT_ID/medical-records \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "medicalRecord=@/path/to/file1.jpg" \
  -F "medicalRecord=@/path/to/file2.jpg"
```

### Using Postman

1. Set request type to `POST`
2. Add `Authorization: Bearer <token>` header
3. Select `Body` tab
4. Choose `form-data`
5. Add key `certificate` (or appropriate field name)
6. Change type to `File`
7. Select file to upload

---

## Production Considerations

### 1. Storage

For production, consider using cloud storage:
- **AWS S3** - Scalable object storage
- **Google Cloud Storage** - Google's object storage
- **Azure Blob Storage** - Microsoft's blob storage
- **Cloudinary** - Image and video management

### 2. CDN Integration

Serve uploaded files through a CDN for better performance:
- CloudFront (AWS)
- Cloud CDN (Google)
- Azure CDN
- Cloudflare

### 3. Backup Strategy

- Regular backups of upload directory
- Store metadata in database
- Implement file versioning
- Consider HIPAA compliance for medical records

### 4. Security Enhancements

- Scan uploaded files for malware
- Implement virus scanning (ClamAV)
- Add watermarking for sensitive documents
- Encrypt files at rest
- Use signed URLs for temporary access

### 5. Optimization

- Image compression (sharp, jimp)
- PDF optimization
- Thumbnail generation
- Lazy loading on frontend
- Progress bars for large uploads

---

## Troubleshooting

### Files Not Uploading

1. Check file size (max 10MB)
2. Verify file type is allowed
3. Ensure correct field name in form-data
4. Check authentication token
5. Verify user has correct role

### Files Not Accessible

1. Check if upload directories exist
2. Verify file permissions
3. Ensure static file serving is enabled
4. Check CORS settings

### Disk Space Issues

1. Monitor upload directory size
2. Implement cleanup policies
3. Archive old files
4. Set up alerts for low disk space

---

## Maintenance

### Cleanup Script

Regularly clean up orphaned files:

```javascript
// Remove files not referenced in database
// Run weekly via cron job
```

### Monitoring

Track:
- Total storage used
- Upload success/failure rates
- File type distribution
- Average file size

---

## Support

For issues related to file uploads:
1. Check server logs for error details
2. Verify file meets requirements
3. Test with cURL to isolate frontend issues
4. Review this documentation
