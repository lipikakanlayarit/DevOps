# Event Management API - Usage Guide

## Overview
This guide explains how organizers can create events and save them to the local database.

## Authentication
All event management endpoints require JWT authentication. Organizers must first log in to get a token.

### 1. Login as Organizer
```bash
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "identifier": "organizer_username_or_email",
  "password": "organizer_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "organizer_username",
  "role": "ORGANIZER"
}
```

## Event Endpoints

### 2. Create an Event (ORGANIZER only)
```bash
POST http://localhost:8080/api/events
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "event_name": "Summer Music Festival",
  "description": "An amazing outdoor music festival",
  "category_id": 1,
  "start_datetime": "2024-07-15T18:00:00Z",
  "end_datetime": "2024-07-15T23:00:00Z",
  "venue_name": "Central Park",
  "venue_address": "123 Park Ave, City",
  "cover_image_url": "https://example.com/poster.jpg",
  "max_capacity": 5000,
  "status": "draft"
}
```

**Response:**
```json
{
  "message": "Event created successfully",
  "event_id": 123,
  "event_name": "Summer Music Festival",
  "status": "draft"
}
```

### 3. Get All Events (authenticated users)
```bash
GET http://localhost:8080/api/events
Authorization: Bearer <your_jwt_token>
```

### 4. Get Event by ID
```bash
GET http://localhost:8080/api/events/123
Authorization: Bearer <your_jwt_token>
```

### 5. Update Event (ORGANIZER only, must be owner)
```bash
PUT http://localhost:8080/api/events/123
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "event_name": "Updated Event Name",
  "status": "published"
}
```

### 6. Delete Event (ORGANIZER only, must be owner)
```bash
DELETE http://localhost:8080/api/events/123
Authorization: Bearer <your_jwt_token>
```

## Field Descriptions

- **event_name** (string, required): The name of the event
- **description** (string, optional): Detailed description of the event
- **category_id** (number, optional): ID referencing the event category
- **start_datetime** (string, ISO 8601 format): When the event starts
- **end_datetime** (string, ISO 8601 format): When the event ends
- **venue_name** (string, optional): Name of the venue
- **venue_address** (string, optional): Physical address of the venue
- **cover_image_url** (string, optional): URL to the event's cover image
- **max_capacity** (number, optional): Maximum number of attendees
- **status** (string, optional): Event status (draft, published, cancelled, etc.)

## Status Codes

- **201 Created**: Event successfully created
- **200 OK**: Request successful
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Not authorized (wrong role or not event owner)
- **404 Not Found**: Event not found

## Security Features

1. **Role-based Access**: Only users with ORGANIZER role can create/update/delete events
2. **Ownership Check**: Organizers can only modify their own events
3. **JWT Authentication**: All endpoints (except login) require valid JWT token
4. **Auto-filled Fields**: 
   - `organizer_id` is automatically set from the authenticated user
   - `created_at` and `updated_at` timestamps are automatically managed

## Example using cURL

```bash
# 1. Login as organizer
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"org_user","password":"password123"}' | jq -r '.token')

# 2. Create an event
curl -X POST http://localhost:8080/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "Tech Conference 2024",
    "description": "Annual technology conference",
    "start_datetime": "2024-09-01T09:00:00Z",
    "end_datetime": "2024-09-01T18:00:00Z",
    "venue_name": "Convention Center",
    "max_capacity": 1000,
    "status": "published"
  }'
```

## Testing the Implementation

To test if the setup works:

1. Make sure your database is running
2. Start the Spring Boot application
3. Login as an organizer to get a JWT token
4. Use the token to create an event via POST /api/events
5. Verify the event was saved by calling GET /api/events

The event will be automatically associated with the authenticated organizer and saved to your local database.
