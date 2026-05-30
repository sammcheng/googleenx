# Privacy Policy

Last updated: 2026-05-29

Food Delivery Price Comparison helps users compare checkout totals across supported food delivery platforms.

## What the extension accesses

- Checkout page details on supported delivery sites such as:
  - restaurant name
  - cart items
  - item quantities
  - item prices
  - subtotal, fees, tax, tip, and total
- User-configured preferences stored in Chrome storage such as:
  - preferred platforms
  - gas price
  - miles per gallon
  - optional location coordinates
- Optional geolocation, only if the user explicitly requests it in the options page

## How data is used

- To compare the current checkout against supported delivery platforms
- To estimate pickup gas cost when the user enables that feature
- To render comparison results in the extension popup

## What is sent to the backend

When the user starts a comparison, the extension may send:

- restaurant and cart item details
- pricing details from the current checkout
- delivery address fields needed for comparison
- user preference fields required for gas or platform filtering
- optional location coordinates, if the user has saved them

## What is not sold

- We do not sell personal information.
- We do not use checkout contents for advertising.

## Data storage

- Preferences are stored in Chrome extension storage.
- Recent comparison results may be stored locally in Chrome storage so the popup can display them.

## Data retention

- Locally stored extension data remains until the user changes settings, clears the extension data, or uninstalls the extension.
- Backend retention depends on the deployed API environment and should be disclosed in the live production policy before store submission.

## Third parties

- Supported food delivery websites
- The deployed comparison API

## Contact

Before Chrome Web Store submission, replace this section with a real support email and public policy URL.
