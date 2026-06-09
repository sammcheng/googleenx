# Chrome Web Store Checklist

## Code and package

- [ ] Confirm `VITE_API_BASE_URL` points at the deployed production API
- [ ] Run `VITE_API_BASE_URL=https://googleenx.onrender.com corepack pnpm --filter food-price-comparison-extension release`
- [ ] Confirm the zip exists at [artifacts/food-delivery-price-comparison-extension.zip](/Users/sammcheng/Desktop/web5/apps/chrome-extension/artifacts/food-delivery-price-comparison-extension.zip)

## Manual verification

- [ ] Load [dist](/Users/sammcheng/Desktop/web5/apps/chrome-extension/dist) as an unpacked extension in Chrome
- [ ] Verify popup opens and renders results
- [ ] Verify options page saves preferences
- [ ] Verify compare button appears on supported checkout pages
- [ ] Verify `autoCompare` behavior matches the setting
- [ ] Verify failures show a useful error when the API is unavailable

## Store listing assets

- [ ] Short description
- [ ] Full description
- [ ] Finalize [STORE_LISTING_DRAFT.md](/Users/sammcheng/Desktop/web5/apps/chrome-extension/STORE_LISTING_DRAFT.md)
- [ ] 128x128 icon
- [ ] At least one screenshot
- [ ] Promotional images if required
- [ ] Support email
- [ ] Public website or support page
- [ ] Record the live support URLs:
  Privacy policy: [https://food-price-comparison-site.onrender.com/privacy-policy/](https://food-price-comparison-site.onrender.com/privacy-policy/)
  Support: [https://food-price-comparison-site.onrender.com/support/](https://food-price-comparison-site.onrender.com/support/)

## Compliance

- [ ] Publish a real hosted privacy policy based on [PRIVACY_POLICY.md](/Users/sammcheng/Desktop/web5/apps/chrome-extension/PRIVACY_POLICY.md)
- [ ] Complete Chrome Web Store data disclosure answers
- [ ] Confirm all requested permissions are necessary and documented
- [ ] Confirm backend retention and logging practices are reflected in the live privacy policy

## Nice-to-have before submission

- [ ] Bump extension version after final QA
- [ ] Add final production screenshots taken from the real extension
- [ ] Test against the deployed API, not only localhost
