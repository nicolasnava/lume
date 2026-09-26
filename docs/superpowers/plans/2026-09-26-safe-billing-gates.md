# Safe Billing Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent unapproved subscription changes, monthly price discounts, and fabricated payment details until a real payment provider is configured.

**Architecture:** Keep the existing subscription UI and server actions, add small pure billing guards for discount and PIX values, and fail closed in server actions. The provider integration remains out of scope; no database writes or remote migrations are made.

**Tech Stack:** Next.js server actions, TypeScript, Supabase service client, Node.js assertion tests.

**Spec:** `docs/superpowers/specs/2026-09-26-fixed-subscription-pricing-design.md`

## Global Constraints

- Only an approved provider payment may activate a plan.
- Monthly charges cannot be discounted; annual purchase is full-price and has no monthly proration credit.
- Never invent a PIX payload or mark payment as approved without provider confirmation.
- Do not apply migrations remotely until the local/remote migration history is reconciled.

## Review Focus

- A financial coupon combined with trial days must not partially apply or increment usage.
- Empty or whitespace-only stored PIX data must not open a fake payment modal.
- A failed plan change must leave the displayed active plan unchanged.
- Admin price-write actions must fail before touching Supabase.
- Existing genuine stored PIX codes remain usable; no replacement payload is generated.

---

### Task 1: Pure billing guards and coupon/plan enforcement

**Files:**
- Create: `src/lib/subscription/billing-guards.ts`
- Modify: `src/app/actions/subscription.ts`
- Modify: `src/app/actions/adminSaasFinance.ts`
- Modify: `src/app/actions/admin.ts`
- Test: `tests/subscription-billing-guards.test.mjs`

**Interfaces:**
- `hasFinancialCouponDiscount(coupon: { desconto_pct?: number | null; desconto_valor?: number | null }): boolean`
- `getStoredPixCode(value: unknown): string | null`

- [ ] **Step 1: Add failing tests** covering zero/positive coupon values and null/blank/trimmed PIX payloads.
- [ ] **Step 2: Run** `node tests/subscription-billing-guards.test.mjs`; confirm failure because the guard module is absent.
- [ ] **Step 3: Implement** the two pure functions; reject financial coupons before updating a profile or incrementing coupon usage; reject plan changes before any Supabase plan mutation; make both admin price-writing actions fail with a clear fixed-price message.
- [ ] **Step 4: Run** `node tests/subscription-billing-guards.test.mjs` and verify all cases pass.

### Task 2: Remove fabricated PIX and avoid optimistic plan UI

**Files:**
- Modify: `src/app/actions/subscription.ts`
- Modify: `src/components/profile/SubscriptionSection.tsx`
- Test: `tests/subscription-billing-guards.test.mjs`

**Interfaces:**
- `getInvoicePaymentDetails(faturaId: string)` returns an actual stored PIX code only; missing/blank code throws a clear unavailable-payment error.

- [ ] **Step 1: Add a failing guard test** confirming missing PIX data resolves to `null` and cannot be substituted with any invoice-derived value.
- [ ] **Step 2: Run** `node tests/subscription-billing-guards.test.mjs`; confirm the new test fails before the implementation change.
- [ ] **Step 3: Remove** invoice-ID-derived PIX generation; show the server error in the existing subscription feedback; reset the annual/monthly selector to the active plan on failed change.
- [ ] **Step 4: Run** the focused test, `npx tsc --noEmit`, and `git diff --check`.

**Self-review:** The plan intentionally does not create invoices, activate subscriptions, reconcile legacy price rows, integrate Asaas, or apply Supabase migrations. Those require provider setup and a verified migration baseline.
