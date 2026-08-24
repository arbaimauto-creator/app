# Feature retention policy

This app keeps the existing consumer and contract workflows while the UI is renewed.

## Core consumer flows — keep active

- Sign-in, sign-up, invite gate, and creator onboarding
- Curated home, vertical review feed, search, notifications, and public profiles
- Camera, video editing, product linking, and review upload
- Campaign application, seeding missions, FGI, review-link submission, rewards, and withdrawal

## Contract flows — preserve, do not delete

- B2B catalogue and inquiry screens
- Brand dashboard, review triage, and brand profile screens

These may be hidden from primary navigation (with brand entry additionally controlled by `BRAND_APP`), but their data and screens must remain compatible until contracts are formally migrated.

## Legacy commerce — isolated

Checkout and order-management navigation is disabled while `FEATURES.COMMERCE` is false. Product discovery and product-to-review linking remain active because they are part of the review workflow.

## Removal rule

A file may be deleted only when it has no import, route, dynamic-load, native-entry, or test reference. Boot diagnostics and startup error handling are always retained.
