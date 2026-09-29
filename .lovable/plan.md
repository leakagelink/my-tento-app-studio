# MyTento client requirement update

## Goal
Uploaded client sheet के अनुसार customer app, provider panel और admin dashboard को update करना, ताकि हर लिखी requirement का working mock मौजूद हो और panels के data/actions आपस में consistent दिखें।

## Customer app
- **Cab को first priority:** Home पर Cab quick-book area सबसे ऊपर रहेगा, Uber/Ola जैसी direct pickup, destination और nearby availability experience के साथ।
- **Cab types और quantity:** Car, SUV, Scorpio, Cruiser और Truckon vehicle choices; 1–5 और custom `+` vehicle count option।
- **Location-wise availability:** pickup/location के आधार पर nearby drivers और estimated arrival दिखेंगे।
- **Fare list:** distance के अनुसार vehicle-wise estimated fare, selected vehicle और total का live calculation।
- **Driver assignment:** booking के बाद driver name, mobile, vehicle number और rating दिखेंगे।
- **Live tracking mock:** map-style route, driver position, ETA और trip status updates।
- **Cab management:** customer booking को reschedule या cancel कर सकेगा और updated state दिखाई देगी।

## Tent and provider capabilities
- Provider profile में inner/outer logo/profile and cover/banner presentation जोड़ी जाएगी।
- Provider अपने available gadgets/services जोड़ सकेगा: DJ, light, decoration और custom item।
- Tent और हर gadget/service का rate editable होगा।
- Normal, Modern, Golden और Royal tent जैसे अलग posts/packages, हर एक के photo और price सहित दिखेंगे।
- नया tent/package बनाते समय price field सही तरह save होकर package card पर दिखेगा।

## Admin dashboard
- Home banner/poster management और provider profile photos management।
- Provider, service, price, location और status edit controls।
- Booking details में customer name, mobile, service, date, time और amount।
- Payment details और filters: Online, Cash और Advance।
- Customer, Provider और Admin के लिए अलग notification views और send action।
- Daily, Weekly और Monthly reports with summary metrics।
- Settings में app controls, banner change और offer creation/management।

## Verification
- Mobile customer Cab flow: select → fare → driver → tracking → reschedule/cancel।
- Provider flow: logo/banner, gadget add, price edit, package creation and visible saved price।
- Admin flow: content management, edit controls, booking/payment details, notifications, reports and settings।
- Check mobile and desktop layouts, key interactions, route metadata and preview errors.

## Scope note
यह पूरा frontend mock रहेगा। वास्तविक GPS movement, location search, phone calls/messages, payments और permanent saved data live services से जुड़ने तक simulated रहेंगे।
