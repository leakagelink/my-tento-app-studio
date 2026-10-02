# MyTento client update plan

## Goal
Apply only the 10 changes from the client’s 2 October notes while preserving existing working features and flows.

## Customer app
- Keep the MyTento logo treatment orange across customer, provider, admin, splash, and branded headings.
- Add quantity controls for each tent gadget/equipment item and include quantity-based amounts in the live booking total.
- Show only providers within 10 km, with each provider’s distance clearly displayed.
- Change guest controls to steps of 20: 20, 40, 60, 80, 100 and onward.
- Replace the plain tent date input with an availability calendar that clearly distinguishes available, selected, and already-booked dates.
- Keep Daily Ride and restore a clearly visible Marriage Booking option in cab booking.
- Add Toto to the main cab vehicle choices and fare calculation.

## Admin panel
- Add a dedicated Cab Control tab.
- Allow admin to manage vehicle name, number, seats/details, base fare, per-km rate, availability, and add/delete vehicles.
- Expand banner management to support 2–4 separate Offer, Update, and Announcement banners with add, edit, activate/pause, and delete controls.

## Provider panel
- Add vehicle number fields to the provider profile/inventory area.
- Let providers add/remove vehicle records and show an explicit saved state after profile save.

## Verification
- Test the central customer flows for tent quantities, 20-person guest steps, calendar availability, 10 km provider filtering, Daily/Marriage cab booking, and Toto.
- Test admin cab controls and multi-banner controls.
- Test provider vehicle-number save behavior.
- Check customer, provider, and admin views at mobile width for overflow and visible controls.
- Confirm the preview build has no errors.

## Technical details
- Keep shared customer/provider/admin demo controls in `src/components/client-requirement-panels.tsx`.
- Continue using local React state because this remains a mock app; no backend or permanent storage will be added.
- Reuse existing semantic colors and shared button components; no unrelated redesign.
