# Food Delivery Price Comparison Chrome Extension

Chrome extension for comparing food delivery checkout totals across DoorDash, Uber Eats, Grubhub, and Seamless.

## What it does

- Detects supported checkout and cart pages
- Extracts cart details from the current page
- Sends the normalized cart to the comparison API
- Shows delivery and pickup comparisons in the popup
- Estimates pickup gas cost using saved vehicle preferences
- Supports optional automatic comparison on checkout pages
- Leaves auto-compare off by default until the user enables it

## Supported platforms

- DoorDash
- Uber Eats
- Grubhub
- Seamless

## Local development

```bash
corepack pnpm --filter food-price-comparison-extension build
```

Load [dist](/Users/sammcheng/Desktop/web5/apps/chrome-extension/dist) in `chrome://extensions` with `Developer mode` enabled.

## Production build

1. Create an env file from [.env.example](/Users/sammcheng/Desktop/web5/apps/chrome-extension/.env.example)
2. Set `VITE_API_BASE_URL` to the real production API
3. Run the production release flow:

```bash
VITE_API_BASE_URL=https://your-real-api.example.com \
corepack pnpm --filter food-price-comparison-extension release
```

The uploadable archive will be created at [artifacts/food-delivery-price-comparison-extension.zip](/Users/sammcheng/Desktop/web5/apps/chrome-extension/artifacts/food-delivery-price-comparison-extension.zip).

The `release` script now runs tests, builds the extension, validates that the packaged manifest points at a real `https` API origin, and then creates the upload zip.

## Permissions used

- `activeTab`
  - interact with the current supported checkout tab
- `storage`
  - save preferences and recent comparison results
- `alarms`
  - periodic background cleanup
- `geolocation`
  - optional location capture only when the user explicitly requests it from settings
- `notifications`
  - comparison success and failure notifications

Host permissions are limited to supported delivery sites plus the comparison API origin.

## Data flow

- The extension reads checkout/cart details from supported sites.
- Comparison requests are sent to the configured API.
- Results are stored locally so the popup can display them.

This means the extension is not local-only. The deployed privacy policy must accurately disclose server-side processing.

## Store submission files

- Draft privacy policy: [PRIVACY_POLICY.md](/Users/sammcheng/Desktop/web5/apps/chrome-extension/PRIVACY_POLICY.md)
- Submission checklist: [CHROME_WEB_STORE_CHECKLIST.md](/Users/sammcheng/Desktop/web5/apps/chrome-extension/CHROME_WEB_STORE_CHECKLIST.md)

## Verification commands

```bash
corepack pnpm --filter food-price-comparison-extension test -- --run
corepack pnpm --filter food-price-comparison-extension type-check
corepack pnpm --filter food-price-comparison-extension build
```
