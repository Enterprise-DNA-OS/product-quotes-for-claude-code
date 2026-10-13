insert into products(id,name,sku,cost_cents) values
 ('10000000-0000-0000-0000-000000000001','Monitoring gateway','GATEWAY',65000),
 ('10000000-0000-0000-0000-000000000002','Commissioning session','SETUP',18000),
 ('10000000-0000-0000-0000-000000000003','Annual support','SUPPORT',12000),
 ('10000000-0000-0000-0000-000000000004','Monitoring sensor','SENSOR',8000) on conflict do nothing;
insert into pricebooks(id,name,currency) values
 ('20000000-0000-0000-0000-000000000001','New Zealand standard','NZD'),
 ('20000000-0000-0000-0000-000000000002','Australia standard','AUD') on conflict do nothing;
insert into prices(pricebook_id,product_id,unit_cents) select b.id,p.id,case p.sku when 'GATEWAY' then 110000 when 'SETUP' then 32000 when 'SUPPORT' then 24000 else 15000 end from pricebooks b cross join products p where b.id::text like '20000000%' and p.id::text like '10000000%' on conflict do nothing;
insert into bundle_rules(parent_id,required_id) values('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002') on conflict do nothing;
insert into quotes(id,name,customer,owner,pricebook_id,expires,terms,tax_bps,tax_note,last_contact) values
 ('30000000-0000-0000-0000-000000000001','HQ-101 Harbour sensors','Harbour Instruments','Aroha','20000000-0000-0000-0000-000000000001',current_date+5,'Two gateways with commissioning. Delivery by agreement.',1500,'NZ standard GST included in total',current_date-18),
 ('30000000-0000-0000-0000-000000000002','HQ-102 Southern monitoring','Southern Systems','Ben','20000000-0000-0000-0000-000000000002',current_date-3,'',1000,'',current_date-24),
 ('30000000-0000-0000-0000-000000000003','HQ-103 Harbour expansion','Harbour Labs','Aroha','20000000-0000-0000-0000-000000000001',current_date+21,'Four sensors. Freight included. No recurring charges.',1500,'NZ standard GST included in total',current_date-2) on conflict do nothing;
insert into quote_lines(quote_id,product_id,quantity,unit_cents,cost_cents,discount_bps) values
 ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',2,110000,65000,1500),
 ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',2,32000,18000,0),
 ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001',1,110000,65000,2500),
 ('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004',4,15000,8000,0) on conflict do nothing;
