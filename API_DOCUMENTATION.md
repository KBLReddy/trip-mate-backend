<!-- API_DOCUMENTATION.md -->
# TripMate API Documentation

## Base URL

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:


## Available Endpoints

### Health Check
- `GET /` - API information
- `GET /health` - Health check

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile

### Tours
- `GET /api/tours` - List tours (public)
- `GET /api/tours/:id` - Tour details (public)
- `POST /api/tours` - Create tour (admin/guide)
- `PUT /api/tours/:id` - Update tour (admin/guide)
- `DELETE /api/tours/:id` - Delete tour (admin/guide)

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Posts
- `GET /api/posts` - List posts (public)
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Post details (public)
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Toggle like

### Comments
- `GET /api/posts/:postId/comments` - List comments (public)
- `POST /api/posts/:postId/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/stats` - Notification statistics
- `PUT /api/notifications/mark-read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Error Responses
All errors follow this format:
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "error": "Bad Request",
  "message": "Error description"
}