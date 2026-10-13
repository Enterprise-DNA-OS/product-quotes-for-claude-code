# Bring your Salesforce product quoting records across

The free importer accepts Salesforce standard-object CSV exports. It does not translate every Revenue Cloud configuration or the older managed-package CPQ objects. Confirm the exported object names before promising a cutover. One command imports a supported set and preserves every input column as source_data.

## Export

Use Salesforce Data Loader with the permissions required for your organisation. [Salesforce's export walkthrough](https://help.salesforce.com/s/articleView?id=000384199&language=en_US&type=1), checked 13 October 2026, shows exporting PriceBookEntry with product and pricebook IDs. Export related objects from the same organisation and save these exact filenames:

| File | Required headings | Mapping |
|---|---|---|
| Product2.csv | Id, Name, IsActive | ProductCode becomes SKU, or Id when blank. No cost is invented. |
| Pricebook2.csv | Id, Name, IsActive | CurrencyIsoCode when present, otherwise your explicit currency. |
| PricebookEntry.csv | Id, Product2Id, Pricebook2Id, UnitPrice, IsActive | Product price in that pricebook. CurrencyIsoCode must agree. |
| Account.csv | Id, Name | Required if importing quotes, used to resolve the customer name. Raw account rows are not stored separately. |
| Quote.csv | Id, Name, AccountId, Pricebook2Id | Optional with QuoteLineItem. ExpirationDate, Description and OwnerId map when present. Missing expiry becomes an expired draft. |
| QuoteLineItem.csv | Id, QuoteId, PricebookEntryId, Quantity, UnitPrice | Discount is a percent. Quantity must be an integer. |

Export headers can use any letter case. These are explicit accepted headings, not a promise that every report export has the same shape. Keep source IDs. Unknown relationships, invalid amounts, duplicate IDs and mismatched currencies roll back the entire batch. CSV supports BOM, quoted commas, quoted newlines and CRLF.

## Import in one command

Use a separate empty database, not the demo store. Run migrate, then:

```bash
npm run quotes -- import salesforce --dir=/path/to/export --currency=NZD --actor="Migration operator" --dry-run
npm run quotes -- import salesforce --dir=/path/to/export --currency=NZD --actor="Migration operator"
```

The dry run writes nothing. An identical repeat is a no-op. A changed record with the same source ID is rejected for reconciliation. Original source fields are retained on products, pricebooks, prices, quotes and lines. Import does not overwrite local changes on an unchanged source record.

## Review before use

Use /cost-review to record quote-line costs in the quote currency. Use /terms to confirm scope, expiry and tax treatment. Build required component rules with /bundle-rule. Read /quote, /bundle-check and /compliance. Imported quotes always remain drafts until a responsible operator approves them. Compare counts and totals to the source exports, then save a full export and a database backup.

## What needs mapping

The free base does not import SBQQ__ objects, native Revenue Cloud transactional objects, product option groups, configuration formulas, pricing procedures, document files, approval authorities, audit logs, signatures, orders, invoices, subscription schedules or usage. These need an agreed mapping and reconciliation. Multiple currencies for a single pricebook require splitting into distinct local pricebooks. Duplicate product lines in one quote and fractional quantities are rejected rather than silently merged. Missing costs stay unknown.

The output of /export is a JSON backup of all nine local record sets. It is not a Salesforce upload or a restore utility. Keep native database backups and test recovery before moving production work. Enterprise DNA maps your actual export as part of a scoped migration.
