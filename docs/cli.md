# CLI reference

Run npm run quotes -- followed by a command below. All accept --json.

| Command | Arguments |
|---|---|
| help | None |
| catalog | None |
| pricebooks | None |
| quotes | None |
| discount-review | None |
| expiring | None |
| bundle-check | None |
| margin-review | None |
| owner-workload | None |
| price-drift | None |
| attention | None |
| compliance | None |
| activity | None |
| approvals | None |
| quote | <quote> |
| weekly-review | None |
| add-product | --sku= --name= --cost-cents= --currency= --actor= |
| cost-review | <quote> --product= --cost-cents= --reason= --actor= |
| add-pricebook | --name= --currency= --actor= |
| set-price | <product> --book= --unit-cents= --actor= |
| bundle-rule | <product> --requires= --ratio= --actor= |
| new-quote | --name= --customer= --owner= --book= --expires=YYYY-MM-DD --actor= |
| add-line | <quote> --product= --quantity= --actor= |
| discount | <quote> --product= --bps= --actor= |
| terms | <quote> --terms= --tax-bps= --tax-note= --expires=YYYY-MM-DD --actor= |
| approve | <quote> --reason= --actor= |
| mark-issued | <quote> --actor= |
| revise | <quote> --reason= --actor= |
| log | <quote> --note= --actor= |
| draft-quote | <quote> |
| import | salesforce --dir= --currency= --actor= [--dry-run] |
| export | [--out=] |

Prices and costs are integer cents. Discounts and tax use basis points: 100 is one percent. Quantity is a positive integer. Every line is rounded to cents after its discount, then quote tax is rounded on the sum. Margin excludes tax. Costs are only copied when their currency matches the pricebook. Use cost-review to supply another quote-currency cost. Currencies are never converted or combined.

set-price changes future quotes only. price-drift identifies older quotes. add-line rejects duplicate products. terms, discount, add-line, cost-review and revise save the previous quote snapshot and increment the revision. Approval history remains on the earlier revision. mark-issued saves a full issue snapshot and freezes edits until revise.

The 10 percent discount threshold and 14-day stale interval are internal policies in the migration views. Expiring includes overdue dates and the next seven days. bundle-rule enforces direct required-component quantities; it is not an option-group solver. Updating a rule can create new findings on an existing quote, and mark-issued rechecks them.

export writes all nine record sets as JSON. import is atomic, preserves source fields, detects exact repeats and rejects changed source IDs. Only import supports --dry-run. docs and view use OUTPUT_DIR when set; this is how tests keep files isolated.
