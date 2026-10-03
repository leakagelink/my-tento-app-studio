# Live service testing and admin management

## Build
- Add a small set of clearly labeled demo providers and service prices to the live database so customer service screens have testable records.
- Add a Services tab to the admin panel with live add, edit, activate/pause, and delete actions.
- Keep service changes protected by the existing database admin-role rules.
- Refresh customer and admin lists immediately after changes.

## Verification
- Test service creation, editing, visibility changes, and deletion through the signed-in admin panel.
- Confirm customer service discovery shows only active, verified providers within 10 km.
- Check desktop/mobile layout and ensure the latest build has no errors.

## Technical details
- Existing `services` rows remain service categories; admin-managed listings use providers plus their `provider_services` records because those contain price and provider details.
- Demo records will be clearly named and stored in Lovable Cloud, not embedded in screen code.
