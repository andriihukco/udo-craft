# UDO Craft - MVP Userflows Documentation

## Overview
UDO Craft is a custom print-on-demand platform with two main applications:
- **Client App** (port 3000): Customer-facing catalog and customization
- **Admin App** (port 3001): Order management and analytics

---

## 🛒 Client App Userflows

### 1. Product Discovery & Browsing
**Entry Point**: `/` (Homepage)
**User Actions**:
- View hero section with brand messaging
- Browse product collections (clothing & accessories)
- Filter products by category
- View product details with images

**Data Flow**:
- Fetches products from `supabase.products` table
- Displays products in grid layout
- Splits products into clothing vs accessories

**API Endpoints**:
- `GET /api/products` - Fetch all products

### 2. Product Customization
**Entry Point**: `/customize/[productId]`
**User Actions**:
- Select product size (S, M, L, XL)
- Choose product color (black, white, gray, navy)
- Upload logo/image file
- Adjust print placement and size
- Set quantity (minimum 10)
- Preview custom design in real-time
- Add to cart

**Data Flow**:
- Loads product and print zone data
- Handles file upload to Supabase storage
- Creates mockup with custom design
- Stores customization data in session

**API Endpoints**:
- `GET /api/products/[id]` - Fetch specific product
- File upload to Supabase Storage

### 3. Contact & Lead Generation
**Entry Point**: Contact form on homepage
**User Actions**:
- Fill contact form (name, email, phone, company, message)
- Upload optional files
- Submit form

**Data Flow**:
- Creates lead record in `supabase.leads` table
- Status set to "new"
- Tracks analytics event
- Sends confirmation to user

**API Endpoints**:
- `POST /api/leads` - Create new lead

### 4. Order Placement (Checkout)
**Entry Point**: `/checkout` or `/order`
**User Actions**:
- Review cart items
- Enter shipping information
- Confirm order details
- Submit order

**Data Flow**:
- Validates cart data
- Creates order items in `supabase.order_items` table
- Updates lead status
- Generates order confirmation

**API Endpoints**:
- `POST /api/leads` - Create order lead
- `POST /api/production/[item_id]` - Production queue

---

## 👨‍💼 Admin App Userflows

### 1. Authentication & Access
**Entry Point**: `/login`
**User Actions**:
- Login with credentials
- Access dashboard after auth

**Data Flow**:
- Auth via Supabase Auth
- Session management
- Redirect to dashboard

**API Endpoints**:
- `GET /auth/callback` - OAuth callback

### 2. Dashboard Overview
**Entry Point**: `/` (Dashboard)
**User Actions**:
- View real-time metrics
- Monitor revenue, orders, clients
- Check conversion rates
- Refresh data

**Data Flow**:
- Aggregates data from multiple tables
- Calculates trends (today vs yesterday)
- Real-time metric updates

**Data Sources**:
- `supabase.leads` - Revenue and orders
- `supabase.site_events` - Analytics and sessions
- `supabase.order_items` - Product metrics

**API Endpoints**:
- `GET /api/analytics/dashboard` - Dashboard metrics

### 3. Lead Management
**Entry Point**: `/clients`
**User Actions**:
- View all leads/customers
- Filter by status (new, in_progress, production, completed)
- Update lead status
- View customer details

**Data Flow**:
- Fetches leads with status filtering
- Updates lead status in database
- Tracks status changes

**API Endpoints**:
- `GET /api/leads` - List all leads
- `PATCH /api/leads/[id]` - Update lead status

### 4. Product Management
**Entry Point**: `/products`
**User Actions**:
- View all products
- Add new products
- Edit product details
- Manage print zones
- Upload product images

**Data Flow**:
- CRUD operations on products
- Print zone management
- Image storage

**API Endpoints**:
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PATCH /api/products/[id]` - Update product

### 5. Order Management
**Entry Point**: `/orders`
**User Actions**:
- View all orders
- Update order status
- Track production progress
- Manage fulfillment

**Data Flow**:
- Order status tracking
- Production queue management
- Customer notifications

**API Endpoints**:
- `GET /api/leads` - Orders (filtered leads)
- `POST /api/production/[item_id]` - Production updates

### 6. Analytics & Reporting
**Entry Point**: `/analytics`
**User Actions**:
- View detailed analytics
- Export reports
- Monitor KPIs
- Track conversion funnels

**Data Flow**:
- Complex analytics calculations
- Data aggregation
- Report generation

**API Endpoints**:
- `GET /api/analytics/dashboard` - Analytics data

---

## 🔄 Cross-App Data Flow

### Lead to Order Pipeline
1. **Client App**: User submits contact form → Creates lead (status: "new")
2. **Admin App**: Admin reviews lead → Updates status to "in_progress"
3. **Admin App**: Admin processes order → Updates status to "production"
4. **Admin App**: Order completed → Updates status to "completed"

### Product Sync
1. **Admin App**: Products managed in admin panel
2. **Client App**: Products fetched from shared database
3. Both apps use same `supabase.products` table

### Analytics Tracking
1. **Client App**: Tracks user interactions (page views, form submits)
2. **Admin App**: Aggregates analytics data for dashboard
3. Shared `supabase.site_events` table

---

## 📊 Database Schema Overview

### Core Tables
- `products` - Product catalog
- `leads` - Customer leads and orders
- `order_items` - Individual order line items
- `site_events` - Analytics events
- `print_zones` - Print area definitions

### Relationships
- `leads` → `order_items` (one-to-many)
- `products` → `print_zones` (one-to-many)
- `order_items` → `products` (foreign key)

---

## 🧪 Test Coverage Areas

### Unit Tests
- [x] Component rendering
- [x] Business logic calculations
- [x] Schema validation
- [x] API route handlers

### E2E Tests Needed
- [ ] Complete client user journey
- [ ] Admin authentication flow
- [ ] Lead management workflow
- [ ] Product customization flow
- [ ] Cross-app data synchronization

---

## 🚀 Current Issues & Fixes Needed

### 1. Supabase Integration
- **Issue**: Client form submissions not appearing in admin
- **Root Cause**: Database connection or permissions
- **Fix**: Verify Supabase keys and RLS policies

### 2. File Upload Flow
- **Issue**: Logo upload not working in customizer
- **Root Cause**: Storage bucket permissions
- **Fix**: Configure Supabase Storage policies

### 3. Real-time Updates
- **Issue**: Admin dashboard not reflecting new leads immediately
- **Root Cause**: Missing real-time subscriptions
- **Fix**: Implement Supabase Realtime

---

## 🎯 MVP Success Metrics

### User Engagement
- Form submission conversion rate > 5%
- Average time on customization page > 2 minutes
- Cart abandonment rate < 70%

### Business Metrics
- Lead-to-order conversion rate > 20%
- Average order value > $500
- Admin response time < 24 hours

### Technical Metrics
- Page load time < 3 seconds
- 99% uptime for both apps
- Zero data loss incidents
