# RevSync API Documentation 📖

Welcome to the RevSync API documentation. This guide covers all available endpoints, request/response formats, and authentication methods.

## 🚀 Base URL

**Development**: `http://127.0.0.1:8000/api/`  
**Production**: `https://api.revsync.dev/api/`

## 🔐 Authentication

RevSync uses JWT (JSON Web Token) authentication for protected endpoints.

### Getting a Token
```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

### Using Tokens
```bash
Authorization: Bearer your_jwt_token_here
```

### Token Refresh
```bash
POST /api/auth/refresh/
{
  "refresh": "your_refresh_token"
}
```

---

## 🏍️ Bikes API

### Motorcycles

#### List All Motorcycles
```http
GET /api/bikes/motorcycles/
```

**Query Parameters:**
- `manufacturer` - Filter by manufacturer name
- `category` - Filter by motorcycle category
- `year` - Filter by manufacturing year
- `displacement_min` - Minimum engine displacement (cc)
- `displacement_max` - Maximum engine displacement (cc)
- `power_min` - Minimum power (HP)
- `power_max` - Maximum power (HP)
- `price_min` - Minimum price (USD)
- `price_max` - Maximum price (USD)
- `search` - Search in name and manufacturer
- `ordering` - Sort by: `name`, `year`, `price`, `power_hp`, `-created_at`
- `page` - Page number for pagination
- `page_size` - Items per page (default: 20)

**Example Request:**
```bash
curl "http://127.0.0.1:8000/api/bikes/motorcycles/?manufacturer=Honda&category=Sport&page=1"
```

**Response:**
```json
{
  "count": 45,
  "next": "http://127.0.0.1:8000/api/bikes/motorcycles/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "CBR1000RR-R Fireblade SP",
      "manufacturer": {
        "id": 1,
        "name": "Honda",
        "country": "Japan",
        "founded_year": 1948
      },
      "category": {
        "id": 1,
        "name": "Supersport"
      },
      "year": 2023,
      "engine_displacement": 999,
      "engine_configuration": "Inline-4",
      "power_hp": 217,
      "torque_nm": 113,
      "weight_kg": 201,
      "price_usd": 28500,
      "top_speed_kmh": 299,
      "fuel_capacity_liters": 16.1,
      "abs": true,
      "traction_control": true,
      "quick_shifter": true,
      "riding_modes": "4 modes",
      "primary_image_url": "/media/motorcycles/honda_cbr1000rr.jpg",
      "created_at": "2024-12-11T10:00:00Z"
    }
  ]
}
```

#### Get Motorcycle Details
```http
GET /api/bikes/motorcycles/{id}/
```

**Response:**
```json
{
  "id": 1,
  "name": "CBR1000RR-R Fireblade SP",
  "manufacturer": {
    "id": 1,
    "name": "Honda",
    "country": "Japan",
    "founded_year": 1948,
    "website": "https://honda.com"
  },
  "category": {
    "id": 1,
    "name": "Supersport",
    "description": "High-performance sport motorcycles"
  },
  "year": 2023,
  "engine_displacement": 999,
  "engine_configuration": "Inline-4",
  "engine_type": "Liquid-cooled 4-stroke",
  "power_hp": 217,
  "torque_nm": 113,
  "weight_kg": 201,
  "seat_height_mm": 830,
  "wheelbase_mm": 1455,
  "fuel_capacity_liters": 16.1,
  "price_usd": 28500,
  "top_speed_kmh": 299,
  "acceleration_0_100": 3.0,
  "abs": true,
  "traction_control": true,
  "quick_shifter": true,
  "electronic_suspension": true,
  "riding_modes": "4 modes (Track, Sport, Street, Rain)",
  "primary_image_url": "/media/motorcycles/honda_cbr1000rr.jpg",
  "created_at": "2024-12-11T10:00:00Z",
  "updated_at": "2024-12-11T10:00:00Z"
}
```

#### Popular Motorcycles
```http
GET /api/bikes/motorcycles/popular/
```

Returns the 10 most popular motorcycles sorted by creation date.

### Manufacturers

#### List All Manufacturers
```http
GET /api/bikes/manufacturers/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Honda",
    "country": "Japan",
    "founded_year": 1948,
    "website": "https://honda.com",
    "motorcycle_count": 5
  },
  {
    "id": 2,
    "name": "Ducati",
    "country": "Italy",
    "founded_year": 1926,
    "website": "https://ducati.com",
    "motorcycle_count": 3
  }
]
```

### Categories

#### List All Categories
```http
GET /api/bikes/categories/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Supersport",
    "description": "High-performance sport motorcycles",
    "motorcycle_count": 8
  },
  {
    "id": 2,
    "name": "Naked",
    "description": "Upright riding position street bikes",
    "motorcycle_count": 5
  }
]
```

### Statistics

#### Database Statistics
```http
GET /api/bikes/stats/
```

**Response:**
```json
{
  "total_motorcycles": 17,
  "manufacturers": 12,
  "categories": 8,
  "latest_year": 2023,
  "displacement_range": {
    "min": 125,
    "max": 1254
  },
  "power_range": {
    "min": 11,
    "max": 217
  },
  "price_range": {
    "min": 3500,
    "max": 45000
  }
}
```

---

## 🎯 Tunes API

### Tunes

#### List All Tunes
```http
GET /api/tunes/tunes/
```

**Query Parameters:**
- `creator` - Filter by creator name
- `category` - Filter by tune category
- `is_free` - Filter free tunes (true/false)
- `compatible_bikes` - Filter by compatible motorcycle
- `search` - Search in name and description
- `ordering` - Sort by: `name`, `created_at`, `-created_at`
- `page` - Page number for pagination

**Response:**
```json
{
  "count": 24,
  "next": "http://127.0.0.1:8000/api/tunes/tunes/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "CBR1000RR Track Performance",
      "creator": {
        "id": 1,
        "name": "TuneECU Community",
        "verified": true
      },
      "category": {
        "id": 1,
        "name": "Performance"
      },
      "description": "Optimized ECU mapping for track use",
      "version": "1.2.0",
      "is_free": true,
      "download_count": 156,
      "rating": 4.8,
      "compatible_bikes": ["CBR1000RR", "CBR1000RR-R"],
      "created_at": "2024-12-11T10:00:00Z"
    }
  ]
}
```

#### Get Tune Details
```http
GET /api/tunes/tunes/{id}/
```

#### Featured Tunes
```http
GET /api/tunes/tunes/featured/
```

Returns curated featured tunes.

### Creators

#### List All Creators
```http
GET /api/tunes/creators/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "TuneECU Community",
    "bio": "Open-source ECU tuning community",
    "verified": true,
    "tune_count": 8,
    "total_downloads": 1250
  }
]
```

### Statistics

#### Tune Marketplace Statistics
```http
GET /api/tunes/stats/
```

**Response:**
```json
{
  "total_tunes": 24,
  "free_tunes": 18,
  "verified_creators": 13,
  "categories": 7,
  "total_downloads": 3450,
  "avg_rating": 4.6
}
```

---

## 🔧 Error Handling

### Error Response Format
```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": {
    "field": ["Specific field error"]
  }
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Error Examples

#### Validation Error (400)
```json
{
  "error": "validation_error",
  "message": "Invalid input data",
  "details": {
    "year": ["Year must be between 1900 and 2025"],
    "price": ["Price must be a positive number"]
  }
}
```

#### Authentication Error (401)
```json
{
  "error": "authentication_failed",
  "message": "Invalid or expired token"
}
```

#### Not Found Error (404)
```json
{
  "error": "not_found",
  "message": "Motorcycle with id 999 not found"
}
```

---

## 📊 Rate Limiting

- **Anonymous Users**: 100 requests per hour
- **Authenticated Users**: 1000 requests per hour
- **Premium Users**: 5000 requests per hour

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1640995200
```

---

## 🔍 Filtering & Search

### Query Operators

#### Exact Match
```
?manufacturer=Honda
```

#### Range Filters
```
?displacement_min=600&displacement_max=1000
?price_min=5000&price_max=15000
```

#### Text Search
```
?search=CBR
```

#### Multiple Values
```
?manufacturer=Honda,Ducati,BMW
```

#### Ordering
```
?ordering=name          # Ascending
?ordering=-name         # Descending
?ordering=price,name    # Multiple fields
```

### Complex Query Example
```bash
curl "http://127.0.0.1:8000/api/bikes/motorcycles/?manufacturer=Honda,Ducati&category=Sport&displacement_min=600&price_max=20000&ordering=-power_hp&page=1"
```

---

## 📱 Mobile Integration

### Android Emulator
```javascript
const API_BASE_URL = 'http://10.0.2.2:8000/api';
```

### iOS Simulator
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

### Production
```javascript
const API_BASE_URL = 'https://api.revsync.dev/api';
```

### Example API Client
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.0.2.2:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshToken();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 🧪 Testing the API

### Using cURL
```bash
# Get all motorcycles
curl -X GET "http://127.0.0.1:8000/api/bikes/motorcycles/"

# Get motorcycles with filters
curl -X GET "http://127.0.0.1:8000/api/bikes/motorcycles/?manufacturer=Honda&category=Sport"

# Get database statistics
curl -X GET "http://127.0.0.1:8000/api/bikes/stats/"

# Get tune marketplace stats
curl -X GET "http://127.0.0.1:8000/api/tunes/stats/"
```

### Using JavaScript Fetch
```javascript
// Get popular motorcycles
const response = await fetch('http://127.0.0.1:8000/api/bikes/motorcycles/popular/');
const motorcycles = await response.json();

// Search for sport bikes
const searchResponse = await fetch(
  'http://127.0.0.1:8000/api/bikes/motorcycles/?category=Sport&displacement_min=600'
);
const sportBikes = await searchResponse.json();
```

### Using Python Requests
```python
import requests

# Get all tunes
response = requests.get('http://127.0.0.1:8000/api/tunes/tunes/')
tunes = response.json()

# Get featured tunes
featured_response = requests.get('http://127.0.0.1:8000/api/tunes/tunes/featured/')
featured_tunes = featured_response.json()
```

---

## 📚 SDK Examples

### React Native Service
```typescript
class MotorcycleService {
  async getMotorcycles(filters?: MotorcycleFilters): Promise<Motorcycle[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`/bikes/motorcycles/?${params}`);
    return response.data.results;
  }

  async getMotorcycleById(id: number): Promise<Motorcycle> {
    const response = await api.get(`/bikes/motorcycles/${id}/`);
    return response.data;
  }

  async getPopularMotorcycles(): Promise<Motorcycle[]> {
    const response = await api.get('/bikes/motorcycles/popular/');
    return response.data;
  }
}
```

---

## 🔒 Security

### CORS Configuration
The API is configured to accept requests from:
- `http://localhost:3000` (React development)
- `http://127.0.0.1:8000` (Django development)
- Mobile app clients

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Input Validation
All endpoints include comprehensive input validation:
- Required field validation
- Data type validation
- Range validation for numeric fields
- String length validation
- SQL injection prevention

---

## 📞 Support

For API-related questions:
- **Documentation Issues**: [GitHub Issues](https://github.com/your-username/RevSync/issues)
- **Integration Help**: [GitHub Discussions](https://github.com/your-username/RevSync/discussions)
- **Bug Reports**: Use the bug report template

---

**RevSync API Documentation** - *Version 1.0.0* 🏍️💨

*Last updated: December 2024* 