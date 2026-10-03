# Remove all mock data

## Changes
- Remove customer fixture providers, wallet transactions, fake notifications, simulated tracking, and hardcoded customer names.
- Replace provider demo bookings, reviews, business identity, earnings, inventory, vehicles, and availability with live database reads or clear empty states.
- Replace admin demo providers, bookings, users, payments, statistics, banners, offers, cab controls, and pending-verification lists with live database reads or clear empty states.
- Keep static catalogue labels and service descriptions only where they describe the product rather than pretending to be user activity.
- Update page metadata to remove “demo” wording.

## Validation
- Verify signed-out customer screens show only genuine public catalogue data.
- Verify protected provider/admin pages do not reveal fixtures when their database tables are empty.
- Run security, compilation, and mobile-width checks.

## Scope note
- This removes fake records; features without completed live integrations will show an empty/unavailable state rather than fabricated data.
