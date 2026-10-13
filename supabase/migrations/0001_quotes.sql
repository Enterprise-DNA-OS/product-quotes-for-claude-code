create table products (
 id uuid primary key default gen_random_uuid(), name text not null, sku text not null unique,
 cost_cents bigint check(cost_cents>=0), cost_currency text not null default 'NZD' check(cost_currency ~ '^[A-Z]{3}$'), active boolean not null default true,
 source_id text unique, source_data jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table pricebooks (
 id uuid primary key default gen_random_uuid(), name text not null unique, currency text not null check(currency ~ '^[A-Z]{3}$'),
 active boolean not null default true, source_id text unique, source_data jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table prices (
 id uuid primary key default gen_random_uuid(), pricebook_id uuid not null references pricebooks, product_id uuid not null references products,
 unit_cents bigint not null check(unit_cents>=0), active boolean not null default true, source_id text unique, source_data jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(pricebook_id,product_id)
);
create table bundle_rules (
 id uuid primary key default gen_random_uuid(), parent_id uuid not null references products, required_id uuid not null references products,
 ratio integer not null default 1 check(ratio>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(parent_id,required_id), check(parent_id<>required_id)
);
create table quotes (
 id uuid primary key default gen_random_uuid(), name text not null unique, customer text not null, owner text not null,
 pricebook_id uuid not null references pricebooks, status text not null default 'draft' check(status in ('draft','approved','issued')),
 revision integer not null default 1, expires date not null, terms text not null default '', tax_bps integer not null default 0 check(tax_bps between 0 and 10000),
 tax_note text not null default '', last_contact date not null default current_date, source_id text unique, source_data jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table quote_lines (
 id uuid primary key default gen_random_uuid(), quote_id uuid not null references quotes, product_id uuid not null references products,
 quantity integer not null check(quantity>0), unit_cents bigint not null check(unit_cents>=0), cost_cents bigint check(cost_cents>=0),
 discount_bps integer not null default 0 check(discount_bps between 0 and 10000), source_id text unique, source_data jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(quote_id,product_id)
);
create table approvals (
 id uuid primary key default gen_random_uuid(), quote_id uuid not null references quotes, revision integer not null,
 actor text not null, reason text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), quote_id uuid references quotes, actor text not null, action text not null, detail text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_batches (
 id uuid primary key default gen_random_uuid(), digest text not null unique, actor text not null, records integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['products','pricebooks','prices','bundle_rules','quotes','quote_lines','approvals','activity','import_batches'] loop
 execute format('create trigger touch_updated before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
end loop; end $$;
create view line_totals as
 select l.*,p.sku,p.name as product,
 round(l.quantity::numeric*l.unit_cents*(10000-l.discount_bps)/10000)::bigint as net_cents,
 l.quantity*l.cost_cents as extended_cost_cents
 from quote_lines l join products p on p.id=l.product_id;
create view quote_totals as
 select q.*, b.currency,b.name as pricebook,
 count(l.id)::integer as line_count, coalesce(sum(l.net_cents),0)::bigint as net_cents,
 round(coalesce(sum(l.net_cents),0)*q.tax_bps/10000)::bigint as tax_cents,
 (coalesce(sum(l.net_cents),0)+round(coalesce(sum(l.net_cents),0)*q.tax_bps/10000))::bigint as total_cents,
 case when count(l.id)=count(l.cost_cents) then coalesce(sum(l.net_cents-l.extended_cost_cents),0)::bigint end as margin_cents,
 coalesce(max(l.discount_bps),0) as max_discount_bps,
 count(l.id) filter(where l.cost_cents is null)::integer as unknown_costs
 from quotes q join pricebooks b on b.id=q.pricebook_id left join line_totals l on l.quote_id=q.id group by q.id,b.id;
create view bundle_gaps as
 select q.id as quote_id,q.name,p.sku as bundle,rp.sku as missing_sku,
 (l.quantity*r.ratio-coalesce(rl.quantity,0)) as missing_quantity
 from quotes q join quote_lines l on l.quote_id=q.id join bundle_rules r on r.parent_id=l.product_id
 join products p on p.id=l.product_id join products rp on rp.id=r.required_id
 left join quote_lines rl on rl.quote_id=q.id and rl.product_id=r.required_id
 where coalesce(rl.quantity,0)<l.quantity*r.ratio;
create view quote_attention as
 select id,name,customer,owner,currency,status,expires,total_cents,
 expires<current_date as expired, last_contact<current_date-14 as stale,
 max_discount_bps>1000 as discount_review, unknown_costs,
 (select count(*)::integer from bundle_gaps g where g.quote_id=t.id) as bundle_gaps
 from quote_totals t where status<>'issued' and (expires<=current_date+7 or last_contact<current_date-14 or max_discount_bps>1000 or unknown_costs>0 or exists(select 1 from bundle_gaps g where g.quote_id=t.id));
create view compliance_findings as
 select id as quote_id,name,'PRICE-TERMS'::text as rule,'Missing written scope and terms'::text as finding from quotes where btrim(terms)=''
 union all select id,name,'TAX-DISCLOSURE','Missing tax basis explanation' from quotes where btrim(tax_note)=''
 union all select id,name,'VALIDITY','Quote validity has passed' from quotes where expires<current_date and status<>'issued'
 union all select id,name,'LINE-CHECK','No priced items' from quote_totals where line_count=0
 union all select id,name,'COST-REVIEW','Costs missing: review before margin approval' from quote_totals where unknown_costs>0
 union all select quote_id,name,'BUNDLE-RULE','Required product missing: '||missing_sku from bundle_gaps
 union all select q.id,q.name,'APPROVAL','Current revision lacks recorded approval' from quotes q where q.status in ('approved','issued') and not exists(select 1 from approvals a where a.quote_id=q.id and a.revision=q.revision);
