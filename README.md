# Product Quotes for Claude Code

Product bundles, pricebooks, discount decisions and quote revisions in a database you own. Use Claude Code, Codex, OpenCode or Cursor with the same records and recipes.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free. Install, try the fictional demo and import supported Salesforce exports. | Your product rules, approval process, quote layout and migration mapping. | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=salesforce-revenue-cloud&utm_source=github&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=salesforce-revenue-cloud&utm_source=github&utm_medium=managed) |

Salesforce lists Revenue Cloud Advanced at US$200 per user per month billed annually. That implies US$60,000 a year for 25 users before Sales Cloud, a list-price scenario rather than a customer invoice. [Vendor pricing](https://www.salesforce.com/sales/revenue-lifecycle-management/pricing/), checked 13 October 2026. [Selection and six scores](docs/research.md).

## Quick start

Node 20 or later, Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/product-quotes-for-claude-code.git
cd product-quotes-for-claude-code
npm install
npm run demo
npm test
npm run quotes -- attention
npm run view
npm run docs
```

Open the folder in your coding agent and ask for /weekly-review. PGlite stores local data in .data/db. DATABASE_URL selects Postgres with verified TLS for remote connections. Use a separate empty DATA_DIR and migrate without seed for your own records. No external model API or Salesforce connection is required to run the demo.

## The five weekly jobs

Maintain the pricebook, check product bundles, review discounts, prepare quote drafts and follow up before expiry. The fictional Harbour demo includes an expired quote, a missing commissioning component, stale customer contact, a discount needing review and a clean quote ready for approval. Seed dates are relative to the first run; reseeding preserves changes.

The database has nine record sets and four read-only views. The CLI has 33 commands, including help, and .claude/commands has 34 recipes. [Complete syntax](docs/cli.md).

## Ten questions for your quote meeting

These are implemented analyses, not claims that Salesforce cannot answer them after configuration.

1. Which quotes expire within a week, including ones already overdue? `expiring`
2. Which quotes have had no customer contact for more than fourteen days? `attention`
3. Which discounts exceed our review threshold? `discount-review`
4. Which bundles lack a required component, and how many? `bundle-check`
5. What margin remains after the discount on each quote? `margin-review`
6. Which quoted prices differ from today's pricebook? `price-drift`
7. Which owners carry the most open quoted value, separately by currency? `owner-workload`
8. Which quotes lack costs, scope or a tax explanation? `compliance`
9. Who approved each revision and why? `approvals`
10. What changed between the issued quote and the current revision? `activity`

## Your first hour: ten things to ask for

1. Put our business name, logo and colours on quote drafts.
2. Show the expired quotes first.
3. Explain the margin on HQ-101.
4. Show what is missing from the Southern bundle.
5. Add a product and its price to our NZ pricebook.
6. Draft a quote without sending it.
7. Record a reviewed cost in the quote currency.
8. Preview our Salesforce export before importing it.
9. Add a delivery-region field through a new migration.
10. Add a Monday view for one sales owner.

## Documents and views

brand.json controls printable quote drafts, internal approval briefs and weekly read-only views. npm run docs writes paperwork to docs-out/. npm run view writes dashboards to views/. /draft-quote writes a selected draft under drafts/. Customer quote drafts omit internal costs and approval reasons. Every document remains a draft for human review.

Quotes hold price and cost snapshots. Catalogue changes do not reprice existing quotes. Edits save a snapshot, increment the revision and invalidate approval. Issued quotes are frozen until explicitly revised. Bundle and record checks run again before recording issue. The /compliance checks cite NZ and Australian guidance and distinguish internal policy from legal requirements. [Rules and limits](docs/compliance.md).

## Bring your records

```bash
npm run quotes -- import salesforce --dir=/path/to/export --currency=NZD --actor="Migration operator" --dry-run
npm run quotes -- import salesforce --dir=/path/to/export --currency=NZD --actor="Migration operator"
```

The one-command importer accepts standard Product2, Pricebook2 and PricebookEntry exports, with optional Account, Quote and QuoteLineItem exports. It preserves source fields and rolls back invalid batches. Repeating the same import does nothing; changed source IDs require reconciliation. Imported quotes remain drafts. Native Revenue Cloud and managed-package CPQ objects, product options, pricing procedures and subscription history need mapping. [Export steps and limitations](docs/replace-salesforce-revenue-cloud.md).

## What the free version covers

Catalogue quoting with direct required-component rules, integer quantities, one currency per pricebook and one tax rate per quote. It does not implement the whole Revenue Cloud suite: subscriptions, usage rating, invoices, payments and signatures stay with the systems responsible for those jobs. Enterprise DNA scopes the connections, quoting screens and additional rules you need. [Why no front end](docs/why-no-front-end.md).

The base runs as a trusted operator. Actor labels are not authenticated signatures. Shared operation needs identities, permissions, backup recovery and approval authority rules. Real records and generated output are ignored by Git. No command sends, signs, charges, deletes or records customer acceptance.

## Verification

npm test runs all 33 CLI commands against a temporary database. It asserts exact totals, repeated migrations and seeds, approval invalidation, frozen issued quotes, snapshots, required components, failed-import rollback, changed-source detection, currency handling and escaped documents. GitHub checks run the same suite on Linux, Windows and disposable Postgres. TEST_DATABASE_URL must point to an empty disposable database, never production.

MIT licensed. Not affiliated with Salesforce or Anthropic. Hosting and agent usage have their own costs. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=salesforce-revenue-cloud&utm_source=github&utm_medium=readme).
