# PharmaCare Frontend

React + Vite frontend for the PharmaCare Pharmacy Management System.

## Features

- **Role-Based Access Control**: Admin, Manager, Pharmacist, Cashier
- **Authentication**: JWT-based authentication with protected routes
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Real-time Notifications**: Toast notifications for user feedback
- **Modern Stack**: React 18, Vite, React Router DOM, Axios

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see root README)

## Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (already exists, update if needed)
# VITE_API_URL=http://localhost:10000

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API service layer
│   ├── components/       # Reusable components
│   │   ├── auth/        # Authentication components
│   │   └── layout/      # Layout components (Sidebar, Navbar)
│   ├── context/         # React context (Auth)
│   ├── pages/           # Page components
│   │   ├── auth/        # Login, Register, etc.
│   │   ├── admin/       # Admin pages
│   │   ├── manager/     # Manager pages
│   │   ├── pharmacist/  # Pharmacist pages
│   │   ├── cashier/     # Cashier pages
│   │   └── shared/      # Shared pages
│   ├── App.jsx          # Main app component with routing
│   ├── main.jsx         # App entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:10000
VITE_APP_NAME=PharmaCare
```

## Default Test Accounts

After setting up the backend and database, you can create test users:

**Admin:**
- Role: Admin
- Register as Admin (role_id: 1)
- No branch required

**Manager:**
- Role: Manager (role_id: 2)
- Branch: Select a branch
- Requires admin activation

**Pharmacist:**
- Role: Pharmacist (role_id: 3)
- Branch: Select a branch
- Can be created by manager

**Cashier:**
- Role: Cashier (role_id: 4)
- Branch: Select a branch
- Can be created by manager

## Development

### Adding New Pages

1. Create page component in `src/pages/[role]/`
2. Add route in `src/App.jsx`
3. Update sidebar menu in `src/components/layout/Sidebar.jsx`

### API Integration

All API calls go through `src/api/axios.js` which handles:
- JWT token injection
- Error handling
- Response interceptors

Create service files in `src/api/` for different modules:
- `auth.api.js` - Authentication
- `manager.api.js` - Manager operations
- `pharmacist.api.js` - Pharmacist operations
- `cashier.api.js` - Cashier operations

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# VITE_API_URL=https://your-backend.onrender.com
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

## Technologies

- **React 18** - UI library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Toastify** - Notifications
- **React Icons** - Icons
- **React Hook Form** - Form handling
- **Chart.js** - Charts and graphs

## License

ISC
