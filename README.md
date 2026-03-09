# ZainBook Cloud Based AI SaaS System

## Cloud-Based Property Management, HR, Payroll & Accounting System

ZainBook is a cloud-based multi-tenant SaaS platform designed for real
estate companies, property managers, and businesses operating in the GCC
region. The system combines Property Management, Tenant Management, HR,
Payroll, and Accounting into a single scalable platform.

The platform is designed to support multiple organizations while
ensuring secure data isolation between tenants.

------------------------------------------------------------------------

# Platform Overview

ZainBook operates using a multi-tenant SaaS architecture where each
subscriber creates their own organization workspace.

Each organization can:

-   Manage their properties and tenants
-   Manage employees and payroll
-   Run accounting and financial reports
-   Control user roles and permissions

Each organization only has access to its own data.

------------------------------------------------------------------------

# Core Modules

## Property Management

Features include:

-   Property portfolio management
-   Building management
-   Unit management
-   Tenant management
-   Lease contract management
-   Rent tracking
-   Maintenance requests
-   Complaint management
-   Notice generation

------------------------------------------------------------------------

## Tenant Management

Tenant profiles include:

-   Personal information
-   Passport details
-   Visa details
-   Emirates ID tracking
-   Lease history
-   Payment history

Document uploads and expiry alerts are supported.

------------------------------------------------------------------------

## HR Management

The HR module includes:

-   Employee profiles
-   Department management
-   Job roles
-   Contract management
-   Employee document tracking

Documents supported:

-   Passport
-   Work Visa
-   Emirates ID
-   Iqama
-   Employment contracts

------------------------------------------------------------------------

## Attendance System

Attendance can be tracked using:

-   Manual check-in
-   Biometric integration
-   Mobile check-in
-   GPS tracking

Features:

-   Shift management
-   Overtime calculation
-   Late tracking
-   Attendance reports

------------------------------------------------------------------------

## Payroll System

Payroll features include:

-   Salary structure
-   Allowances
-   Deductions
-   Overtime calculations
-   Payslip generation
-   Payroll reports

The system can generate WPS payroll files required in the UAE.

------------------------------------------------------------------------

## Accounting System

Accounting features include:

-   Chart of accounts
-   Invoice generation
-   Expense tracking
-   Payment tracking
-   Bank reconciliation
-   Profit and loss reports
-   Balance sheet reports
-   Cash flow reports

------------------------------------------------------------------------

## VAT Management

VAT system includes:

-   5% VAT calculation
-   VAT input tracking
-   VAT output tracking
-   VAT reports

------------------------------------------------------------------------

# Multi-Tenant Security

Security is implemented using Row Level Security (RLS).

Key rules:

-   Users can only access their organization data
-   Organization admins manage their users
-   Master admin can access all organizations

All tables include an organization_id column to enforce tenant
isolation.

------------------------------------------------------------------------

# Technology Stack

Frontend:

-   React
-   Vite
-   TailwindCSS

Backend:

-   Supabase
-   PostgreSQL

Authentication:

-   Supabase Auth

------------------------------------------------------------------------

# Project Setup

Clone the repository:

    git clone https://github.com/yourusername/zainbook.git

Install dependencies:

    npm install

Run development server:

    npm run dev

Build production:

    npm run build

------------------------------------------------------------------------

# Environment Variables

Create a `.env` file:

    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_public_key

------------------------------------------------------------------------

# Project Structure

    src
     ├── components
     ├── pages
     ├── modules
     │   ├── properties
     │   ├── tenants
     │   ├── hr
     │   ├── payroll
     │   ├── accounting
     ├── services
     ├── hooks
     ├── utils
     └── layouts

------------------------------------------------------------------------

# Future Integrations

Planned integrations include:

-   Ejari API
-   AI rent price engine
-   Payment gateway integrations
-   Advanced analytics dashboards

------------------------------------------------------------------------

# License

This project is licensed under the MIT License.

------------------------------------------------------------------------

# Author

Developed by Brand Vox Digital Agency.
