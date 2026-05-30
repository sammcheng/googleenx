# Chrome Web Store Listing Draft

## Name

Food Delivery Price Comparison

## Summary

Compare DoorDash, Uber Eats, Grubhub, and Seamless checkout totals to find the best food delivery deal.

## Description

Food Delivery Price Comparison helps you see whether the order in your current cart would cost less on another delivery platform.

### Features

- Compare checkout totals across supported delivery platforms
- View delivery and pickup options in one popup
- Estimate pickup gas cost using your saved MPG and gas price
- Save preferred platforms and comparison settings
- Optional auto-compare on supported checkout pages

### How it works

1. Open a supported checkout or cart page.
2. Start a comparison manually, or let auto-compare run if enabled.
3. The extension extracts your current cart details.
4. Those normalized cart details are sent to the configured comparison API.
5. The popup shows comparable delivery and pickup totals.

### Supported platforms

- DoorDash
- Uber Eats
- Grubhub
- Seamless

### Permissions justification

- `activeTab`: compare the current supported checkout page
- `storage`: save preferences and recent comparison results
- `alarms`: background cleanup for stored auth state
- `geolocation`: optional location capture for more relevant comparisons
- `notifications`: comparison completion and error notices

## Privacy disclosure draft

The extension reads cart and checkout information from supported delivery sites and sends comparison request data to its configured backend service. Preferences and recent results are stored locally in Chrome storage. Replace this draft with the final hosted privacy policy URL during submission.

## Support

Replace with your production support email and website before submission.
