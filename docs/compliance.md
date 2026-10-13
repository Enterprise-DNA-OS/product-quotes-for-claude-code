# Quote record checks

Sources opened 13 October 2026. These checks help the responsible operator review a quote. They do not determine legal compliance, tax jurisdiction, registration, exemptions or the truth of a price claim.

| Rule | Check and action | Basis |
|---|---|---|
| PRICE-TERMS | Require written scope and conditions before approval. Keep snapshots when a quote changes. | [NZ Consumer Protection: quotes and estimates](https://www.consumerprotection.govt.nz/general-help/guide-to-buying-smart/quotes-and-estimates) explains agreed quotes and variations and recommends written detail. Requiring text is our operational control, not a legal assertion that every quote must be written. |
| TAX-DISCLOSURE | Require a tax explanation. Render net, tax and total. The operator includes all unavoidable charges in the lines. | [ACCC: price displays](https://www.accc.gov.au/consumers/pricing/price-displays) covers consumer total-price disclosure including taxes and unavoidable charges. Applicability and B2B exceptions require review. |
| VALIDITY | Block approval and recording issue after the chosen expiry date. | Internal commercial policy, not a statutory quote validity period. |
| BUNDLE-RULE | Block a quote missing a required component or quantity. | Internal product policy, maintained by the business. |
| COST-REVIEW | Block approval where a cost is unknown. Never translate a product cost into another currency. | Internal margin control. |
| LINE-CHECK | Require at least one priced item. | Internal completeness check. |
| APPROVAL | Record operator, reason and revision. A changed quote returns to draft. Recording issue rechecks current conditions. | Internal review control. |

Discount review starts above 10 percent as a visible internal policy in the views. Every quote requires recorded approval, including those below that threshold. Operator names are supplied by the caller, not authenticated signatures. The base is a trusted-operator tool. A managed deployment needs authenticated roles and an approval authority matrix before relying on separation of duties.

Tax rates are explicit inputs in basis points. The seed's NZ and AU rates are fictional example settings, not a tax engine. Mixed tax rates, exemption rules, international supplies and mandatory surcharges require a configured extension and review. Nothing issues an invoice or records acceptance. The mark-issued command only records an operator's statement that a quote was issued elsewhere.

The database keeps revision snapshots and has no deletion command. That is not immutable storage or a legal retention policy. Back up the database, store the actual customer-approved documents and apply a retention policy appropriate to your business.
