# Product Quotes for Claude Code

For sales operators selling configurable products. Read the CLI records before answering. The Harbour demo is fictional. The CLI is the only recurring action path.

Nothing here sends, signs, invoices, charges or records customer acceptance. Draft documents are drafts. mark-issued only records an operator statement about a past action elsewhere. Costs, tax rates, scope and reasons must come from the operator. Never guess them.

Every quote edit invalidates approval. Issued quotes require revise before changes. Import standard Salesforce exports as drafts. Read docs/replace-salesforce-revenue-cloud.md before promising migration. Read docs/compliance.md before explaining a check. Operator labels are not signatures or authenticated roles.

## Recurring jobs

| Job | Recipe |
|---|---|
| catalog | /catalog |
| pricebooks | /pricebooks |
| quotes | /quotes |
| discount review | /discount-review |
| expiring | /expiring |
| bundle check | /bundle-check |
| margin review | /margin-review |
| owner workload | /owner-workload |
| price drift | /price-drift |
| attention | /attention |
| compliance | /compliance |
| activity | /activity |
| approvals | /approvals |
| quote | /quote |
| weekly review | /weekly-review |
| add product | /add-product |
| cost review | /cost-review |
| add pricebook | /add-pricebook |
| set price | /set-price |
| bundle rule | /bundle-rule |
| new quote | /new-quote |
| add line | /add-line |
| quantity | /quantity |
| discount | /discount |
| terms | /terms |
| approve | /approve |
| mark issued | /mark-issued |
| revise | /revise |
| log | /log |
| draft quote | /draft-quote |
| import | /import |
| export | /export |
| Customise a rule or field | /customise |
| Add a read-only view | /new-view |

Run node scripts/quotes.mjs help for syntax. Every command accepts --json. Use partial IDs or case-insensitive names. Ambiguity lists candidates and exits 1. Never choose a candidate silently.

Use brand.json for business name, logo and colours. Keep real records out of Git. drafts/, docs-out/, views/, exports/ and .data/ are ignored. Local operation supports one process at a time. Shared deployment requires authentication, least-privilege database access and tested backups. The supplied CLI uses a trusted database owner connection, never expose it to browsers.

Omni by Enterprise DNA customises and runs your version: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=salesforce-revenue-cloud&utm_source=github&utm_medium=instructions
