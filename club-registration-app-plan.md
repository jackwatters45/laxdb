# Lacrosse Club Registration App — Planning Doc

## Goal

One form to rule them all. Players fill out a single form on our site, and the app:

1. Registers them with the club (internal form)
1. Auto-fills and submits the external league registration form on their behalf
1. Stores their info so next season, renewal is one click: “I’m playing — fill it out for me.”

## Why

- Players currently fill out two near-identical forms every year
- The info barely changes season to season — re-entering it is pure friction
- The club app becomes the source of truth for player data

## Architecture (Cloudflare ecosystem)

|Piece                             |Tool                                                                                                    |
|----------------------------------|--------------------------------------------------------------------------------------------------------|
|App + API                         |Cloudflare Workers                                                                                      |
|Player data                       |D1 (SQLite)                                                                                             |
|Browser automation (external form)|Browser Rendering / Browser Run (Puppeteer or Playwright; consider Stagehand for resilient form-filling)|
|Long-running registration jobs    |Cloudflare Workflows (step-level retries, durable execution)                                            |
|Club card + credentials           |Workers Secrets / Secrets Store — never in D1 or code                                                   |

### Flow

1. Player submits our form (or clicks “renew” with pre-filled data)
1. Player pays via Stripe Checkout (club fee + league fee bundled)
1. On payment success → Workflow kicks off
1. Workflow spins up headless browser, fills external league form, pays with the club’s virtual card, submits
1. Result logged (player, amount, timestamp, confirmation #); player notified

## Payments

- **Players never give us card data.** Stripe collects it; we only store a Stripe customer/token ID. Stripe carries the PCI burden.
- **Renewals:** saved Stripe payment method (with consent) → renewal is genuinely one click.
- **External form payment:** paid by a **club virtual card** (Wise / Revolut Business / Airwallex) — spending limits, single-merchant lock, instantly killable.
- Order of operations: charge player first, confirm, then register externally.
- Every automated charge logged for treasurer reconciliation against Stripe payouts and the card statement.

## Compliance / risk notes (Australia)

- **PCI DSS:** avoided entirely by tokenizing via Stripe and never automating player card entry.
- **Privacy Act / APPs:** likely exempt (small org), but follow best practice anyway — collect only what’s needed, publish a short privacy notice, secure data, delete when stale.
- **Minors:** junior players means kids’ data (DOB, possibly medical). Parental consent on registration, minimal collection, restricted access.
- **External site ToS:** believed fine, but confirm automated submission is acceptable.

## Open questions

- [ ] Can we fully replace the internal club form with the app? (Confirm with committee)
- [ ] Exact fields required by the external league form — map them to our schema
- [ ] Does the external form’s payment step play nicely with automation? (Test carefully)
- [ ] Which virtual card provider?
- [ ] Workers Paid plan needed (free tier = 10 min/day of browser time — not enough)

## Rough build order

1. Schema + internal registration form (Workers + D1)
1. Stripe Checkout integration
1. Browser automation script for external form (manual trigger, test mode)
1. Wrap in a Workflow with logging + retries
1. Renewal flow (“play again” button + saved payment method)
1. Reconciliation/admin view for treasurer