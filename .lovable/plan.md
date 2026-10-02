# MyTento Live Backend Plan

## Goal
Convert the current mock customer, provider, and admin experience into a secure live system using Lovable Cloud, while preserving the existing design and booking flows.

## What will become live
- Email/password signup, sign-in, sign-out, email confirmation, and password reset.
- Full user profiles with customer/provider/admin roles stored securely.
- Provider businesses, services, equipment, vehicles, rates, photos, availability, and verification status.
- Customer tent/event/cab bookings with guest count, add-ons, dates, locations, provider selection, pricing, and status tracking.
- Provider booking acceptance, decline, team/setup progress, calendar availability, and profile/inventory updates.
- Admin provider verification, cab management, banners, offers, booking/payment monitoring, notifications, and reports.
- Payment records prepared for Razorpay orders and callbacks; cash and advance statuses remain supported.
- Live updates for bookings and operational changes where useful.

## Security and data ownership
- Every private table will use row-level access rules.
- Customers see and manage only their own profile and bookings.
- Providers manage only their business, inventory, availability, and assigned bookings.
- Admin access is validated on the server using a separate roles table, never browser storage.
- Public provider listings expose only approved, active information.
- New accounts default to customer; provider/admin elevation is controlled securely.

## Implementation sequence
1. Create the database schema, access rules, role helpers, profile signup trigger, indexes, and initial demo catalogue rows.
2. Enable email/password authentication and add sign-in, signup, forgot-password, reset-password, and session-aware account controls.
3. Add protected server functions for profiles, bookings, providers, availability, inventory, admin controls, and payment records.
4. Connect existing customer screens to live providers, dates, prices, bookings, and payment status.
5. Connect provider and admin panels to the same live records and role checks.
6. Add Razorpay server integration after merchant credentials are supplied; verify signatures before confirming online payments.
7. Test signup/login, customer booking, provider updates, admin controls, sign-out, and mobile layouts end to end.

## Technical details
- TanStack Start server functions will handle app-internal reads and writes.
- Lovable Cloud provides the database, authentication, storage, and realtime updates.
- Razorpay secret credentials will stay server-side; no payment secret will enter browser code.
- Existing local onboarding/language preference may remain device-local because it is presentation preference, not business data.

## Credential needed later
Razorpay Key ID and Key Secret will be requested securely when the core system is ready for payment activation. Without them, bookings and payment records can be live, but real online charging cannot be completed.
