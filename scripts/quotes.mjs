#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
import {page,table as htmlTable,writeOut} from './lib/render.mjs';

export const reads={
 'catalog':`select p.sku,p.name,p.cost_cents,p.cost_currency,p.active,b.name as pricebook,b.currency,e.unit_cents from products p left join prices e on e.product_id=p.id left join pricebooks b on b.id=e.pricebook_id order by p.sku,b.name`,
 'pricebooks':`select id,name,currency,active from pricebooks order by name`,
 'quotes':`select id,name,customer,owner,status,revision,currency,total_cents,expires from quote_totals order by name`,
 'discount-review':`select name,owner,currency,max_discount_bps,net_cents,margin_cents,status from quote_totals where max_discount_bps>1000 and status<>'issued' order by max_discount_bps desc,name`,
 'expiring':`select name,customer,owner,currency,total_cents,expires from quote_totals where status<>'issued' and expires<=current_date+7 order by expires,name`,
 'bundle-check':`select name,bundle,missing_sku,missing_quantity from bundle_gaps order by name,missing_sku`,
 'margin-review':`select name,owner,currency,net_cents,margin_cents,unknown_costs,case when net_cents>0 then round(margin_cents::numeric/net_cents*100,2) end as margin_percent from quote_totals order by margin_cents nulls first,name`,
 'owner-workload':`select owner,currency,count(*)::integer as quotes,sum(total_cents)::bigint as total_cents,count(*) filter(where expires<current_date)::integer as expired from quote_totals where status<>'issued' group by owner,currency order by owner,currency`,
 'price-drift':`select q.name,p.sku,b.currency,l.unit_cents as quoted_cents,e.unit_cents as current_cents from quote_lines l join quotes q on q.id=l.quote_id join products p on p.id=l.product_id join pricebooks b on b.id=q.pricebook_id join prices e on e.pricebook_id=q.pricebook_id and e.product_id=l.product_id where l.unit_cents<>e.unit_cents order by q.name,p.sku`,
 'attention':`select name,owner,currency,status,expires,expired,stale,discount_review,unknown_costs,bundle_gaps from quote_attention order by name`,
 'compliance':`select name,rule,finding from compliance_findings order by name,rule`,
 'activity':`select q.name,a.actor,a.action,a.detail,a.created_at from activity a left join quotes q on q.id=a.quote_id order by a.created_at,a.id`,
 'approvals':`select q.name,a.revision,a.actor,a.reason,a.created_at from approvals a join quotes q on q.id=a.quote_id order by q.name,a.created_at`
};
const syntax={
 ...Object.fromEntries(Object.keys(reads).map(k=>[k,''])),
 'quote':'<quote>', 'weekly-review':'',
 'add-product':'--sku= --name= --cost-cents= --currency= --actor=',
 'cost-review':'<quote> --product= --cost-cents= --reason= --actor=',
 'add-pricebook':'--name= --currency= --actor=',
 'set-price':'<product> --book= --unit-cents= --actor=',
 'bundle-rule':'<product> --requires= --ratio= --actor=',
 'new-quote':'--name= --customer= --owner= --book= --expires=YYYY-MM-DD --actor=',
 'add-line':'<quote> --product= --quantity= --actor=',
 'quantity':'<quote> --product= --quantity= --actor=',
 'discount':'<quote> --product= --bps= --actor=',
 'terms':'<quote> --terms= --tax-bps= --tax-note= --expires=YYYY-MM-DD --actor=',
 'approve':'<quote> --reason= --actor=',
 'mark-issued':'<quote> --actor=',
 'revise':'<quote> --reason= --actor=',
 'log':'<quote> --note= --actor=',
 'draft-quote':'<quote>',
 'import':'salesforce --dir= --currency= --actor= [--dry-run]',
 'export':'[--out=]'
};
export const commandNames=['help',...Object.keys(syntax)];
function required(o,k){if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}=`);return o[k].trim();}
function integer(v,label,min=0,max=1000000000000){if(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v))||Number(v)<min||Number(v)>max)throw Error(`${label} must be an integer from ${min} to ${max}`);return Number(v);}
function currency(v){if(!/^[A-Z]{3}$/.test(v))throw Error('Currency must be three uppercase letters');return v;}
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Invalid calendar date');return v;}
function cents(v){if(!/^\d+(\.\d{1,2})?$/.test(v))throw Error(`Invalid nonnegative money value: ${v}`);const [a,b='']=v.split('.');return integer(BigInt(a)*100n+BigInt(b.padEnd(2,'0')),'Money');}
async function resolve(db,t,ref){if(!ref)throw Error(`Specify ${t} reference`);const rows=await db.query(`select * from ${t} where id::text ilike $1 or name ilike $2 ${t==='products'?'or sku ilike $2':''} order by name`,[ref+'%','%'+ref+'%']);const exact=rows.filter(r=>r.id===ref||r.name.toLowerCase()===ref.toLowerCase()||r.sku?.toLowerCase()===ref.toLowerCase());const found=exact.length===1?exact:rows;if(found.length!==1)throw Error(`${t}: ${found.length?'ambiguous':'no match'} "${ref}"${found.length?'\n'+found.map(r=>r.id+' '+r.name).join('\n'):''}`);return found[0];}
async function audit(db,q,actor,action,detail){await db.query('insert into activity(quote_id,actor,action,detail) values($1,$2,$3,$4)',[q,actor,action,detail]);}
async function lock(db,ref){const q=await resolve(db,'quotes',ref);return (await db.query('select * from quotes where id=$1 for update',[q.id]))[0];}
function editable(q){if(q.status==='issued')throw Error('Issued quote is frozen; revise it first');}
async function invalidate(db,q){await db.query("update quotes set status='draft',revision=revision+1 where id=$1",[q.id]);}
async function detail(db,id){return {quote:(await db.query('select * from quote_totals where id=$1',[id]))[0],lines:await db.query('select sku,product,quantity,unit_cents,discount_bps,net_cents from line_totals where quote_id=$1 order by sku',[id]),findings:await db.query('select rule,finding from compliance_findings where quote_id=$1 order by rule',[id])};}
async function checkReady(db,q){const issues=await db.query('select finding from compliance_findings where quote_id=$1 and rule<>\'APPROVAL\'',[q.id]);if(issues.length)throw Error('Quote needs review: '+issues.map(r=>r.finding).join('; '));}
const exportTables=['products','pricebooks','prices','bundle_rules','quotes','quote_lines','approvals','activity','import_batches'];

async function importSalesforce(db,o){
 const dir=path.resolve(required(o,'dir')),fallback=currency(required(o,'currency')),actor=required(o,'actor');
 const names=['Product2','Pricebook2','PricebookEntry','Account','Quote','QuoteLineItem'];
 const files=Object.fromEntries(names.map(n=>{const f=path.join(dir,n+'.csv');if(!existsSync(f)){if(names.indexOf(n)<3)throw Error(`Missing ${n}.csv`);return[n,null];}return[n,readFileSync(f,'utf8')];}));
 if(Boolean(files.Quote)!==Boolean(files.QuoteLineItem))throw Error('Quote.csv and QuoteLineItem.csv must be supplied together');
 if(files.Quote&&!files.Account)throw Error('Account.csv required with quotes');
 const digest=createHash('sha256').update(JSON.stringify({files,fallback})).digest('hex');
 if((await db.query('select id from import_batches where digest=$1',[digest])).length)return {already_imported:true,records:0};
 const rows=Object.fromEntries(names.map(n=>[n,files[n]===null?[]:parseCsv(files[n])]));
 const maps={};let count=0;
 function val(r,k){const v=pick(r,k);if(!v.trim())throw Error(`Missing Salesforce ${k}`);return v;}
 function boolean(v){if(!['true','false','1','0'].includes(v.toLowerCase()))throw Error('Invalid Salesforce boolean');return ['true','1'].includes(v.toLowerCase());}
 function ref(map,id,label){if(!map?.has(id))throw Error(`Unresolved ${label}: ${id}`);return map.get(id);}
 async function store(t,r,columns,values){const sid=val(r,'Id'),prior=await db.query(`select id,source_data from ${t} where source_id=$1`,[sid]);if(prior.length){if(JSON.stringify(prior[0].source_data)!==JSON.stringify(JSON.parse(JSON.stringify(r),Object.keys(r).sort()))) { const equal=Object.keys(r).length===Object.keys(prior[0].source_data).length&&Object.entries(r).every(([k,v])=>prior[0].source_data[k]===v);if(!equal)throw Error(`Changed source record ${sid}; reconcile before import`);}return prior[0].id;}const cols=[...columns,'source_id','source_data'];const [out]=await db.query(`insert into ${t}(${cols.join(',')}) values(${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning id`,[...values,sid,JSON.stringify(r)]);count++;return out.id;}
 for(const n of names){const seen=new Set();for(const r of rows[n]){const id=val(r,'Id');if(seen.has(id))throw Error(`Duplicate ${n} ID ${id}`);seen.add(id);}}
 maps.products=new Map();for(const r of rows.Product2){const id=await store('products',r,['name','sku','active','cost_currency'],[val(r,'Name'),pick(r,'ProductCode')||val(r,'Id'),boolean(val(r,'IsActive')),fallback]);maps.products.set(val(r,'Id'),id);}
 maps.books=new Map();for(const r of rows.Pricebook2){const cur=currency(pick(r,'CurrencyIsoCode')||fallback);const id=await store('pricebooks',r,['name','currency','active'],[val(r,'Name'),cur,boolean(val(r,'IsActive'))]);maps.books.set(val(r,'Id'),{id,currency:cur});}
 maps.prices=new Map();for(const r of rows.PricebookEntry){const b=ref(maps.books,val(r,'Pricebook2Id'),'pricebook'),p=ref(maps.products,val(r,'Product2Id'),'product');if((pick(r,'CurrencyIsoCode')||fallback)!==b.currency)throw Error('Pricebook currency mismatch; split multi-currency exports into separate pricebooks');const amount=cents(val(r,'UnitPrice'));const id=await store('prices',r,['pricebook_id','product_id','unit_cents','active'],[b.id,p,amount,boolean(val(r,'IsActive'))]);maps.prices.set(val(r,'Id'),{id,product:p,book:b.id});}
 const accounts=new Map(rows.Account.map(r=>[val(r,'Id'),val(r,'Name')]));maps.quotes=new Map();
 for(const r of rows.Quote){const b=ref(maps.books,val(r,'Pricebook2Id'),'quote pricebook');if((pick(r,'CurrencyIsoCode')||fallback)!==b.currency)throw Error('Quote currency mismatch');const id=await store('quotes',r,['name','customer','owner','pricebook_id','expires','terms','tax_note'],[val(r,'Name'),ref(accounts,val(r,'AccountId'),'account'),pick(r,'OwnerId')||'Unassigned',b.id,date(pick(r,'ExpirationDate')||'2000-01-01'),pick(r,'Description'),'']);maps.quotes.set(val(r,'Id'),{id,book:b.id});}
 for(const r of rows.QuoteLineItem){const q=ref(maps.quotes,val(r,'QuoteId'),'quote'),p=ref(maps.prices,val(r,'PricebookEntryId'),'pricebook entry');if(q.book!==p.book)throw Error('Quote line uses a different pricebook');await store('quote_lines',r,['quote_id','product_id','quantity','unit_cents','discount_bps'],[q.id,p.product,integer(val(r,'Quantity'),'quantity',1,1000000),cents(val(r,'UnitPrice')),integer(cents(pick(r,'Discount')||'0'),'discount bps',0,10000)]);}
 await db.query('insert into import_batches(digest,actor,records) values($1,$2,$3)',[digest,actor,count]);
 await audit(db,null,actor,'import',`${count} records; ${digest}`);
 return {records:count,dry_run:Boolean(o['dry-run']),note:'Imported quotes remain drafts. Review costs, tax, terms and bundle rules before approval.'};
}

export async function run(db,argv){
 const o={},pos=[];for(const a of argv){if(a.startsWith('--')){const i=a.indexOf('=');o[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else pos.push(a);}
 const [cmd='help',reference]=pos;
 if(cmd==='help')return commandNames.map(command=>({command,arguments:syntax[command]||''}));
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='quote')return detail(db,(await resolve(db,'quotes',reference)).id);
 if(cmd==='weekly-review')return {attention:await db.query(reads.attention),discounts:await db.query(reads['discount-review']),compliance:await db.query(reads.compliance)};
 if(cmd==='export'){const out={};for(const t of exportTables)out[t]=await db.query(`select * from ${t} order by id`);const f=path.resolve(o.out||path.join(process.env.OUTPUT_DIR||REPO_ROOT,'exports','quotes.json'));mkdirSync(path.dirname(f),{recursive:true});writeFileSync(f,JSON.stringify(out,null,2)+'\n',{mode:0o600});return {file:f,record_sets:exportTables.length};}
 if(cmd==='draft-quote'){const q=await resolve(db,'quotes',reference),d=await detail(db,q.id);const f=writeOut('drafts',q.id+'-r'+q.revision,page({title:'DRAFT product quote',subtitle:q.name,sections:[{title:'Customer and terms',note:'Review before sharing. This is not an invoice or evidence of acceptance.',html:htmlTable([{customer:q.customer,revision:q.revision,expires:q.expires,terms:q.terms,tax_note:q.tax_note}])},{title:'Items',html:htmlTable(d.lines.map(l=>({...l,currency:d.quote.currency})))},{title:'Total including recorded tax',html:htmlTable([{currency:d.quote.currency,net_cents:d.quote.net_cents,tax_cents:d.quote.tax_cents,total_cents:d.quote.total_cents}])}]}));return {file:f,status:'draft'};}
 if(!Object.hasOwn(syntax,cmd))throw Error(`Unknown command ${cmd}`);
 const actor=required(o,'actor');await db.exec('begin');
 try{
 let out;
 if(cmd==='import'){if(reference!=='salesforce')throw Error('Supported import: salesforce');out=await importSalesforce(db,o);}
 else if(cmd==='add-product'){out=(await db.query('insert into products(name,sku,cost_cents,cost_currency) values($1,$2,$3,$4) returning id,name',[required(o,'name'),required(o,'sku'),integer(required(o,'cost-cents'),'cost'),currency(required(o,'currency'))]))[0];await audit(db,null,actor,cmd,out.name);}
 else if(cmd==='add-pricebook'){out=(await db.query('insert into pricebooks(name,currency) values($1,$2) returning id,name',[required(o,'name'),currency(required(o,'currency'))]))[0];await audit(db,null,actor,cmd,out.name);}
 else if(cmd==='set-price'){const p=await resolve(db,'products',reference),b=await resolve(db,'pricebooks',required(o,'book'));await db.query('insert into prices(pricebook_id,product_id,unit_cents) values($1,$2,$3) on conflict(pricebook_id,product_id) do update set unit_cents=excluded.unit_cents',[b.id,p.id,integer(required(o,'unit-cents'),'price')]);out={product:p.sku,pricebook:b.name};await audit(db,null,actor,cmd,JSON.stringify(out));}
 else if(cmd==='bundle-rule'){const p=await resolve(db,'products',reference),r=await resolve(db,'products',required(o,'requires'));await db.query('insert into bundle_rules(parent_id,required_id,ratio) values($1,$2,$3) on conflict(parent_id,required_id) do update set ratio=excluded.ratio',[p.id,r.id,integer(required(o,'ratio'),'ratio',1,1000000)]);out={bundle:p.sku,requires:r.sku};await audit(db,null,actor,cmd,JSON.stringify(out));}
 else if(cmd==='new-quote'){const b=await resolve(db,'pricebooks',required(o,'book'));if(!b.active)throw Error('Inactive pricebook');out=(await db.query('insert into quotes(name,customer,owner,pricebook_id,expires) values($1,$2,$3,$4,$5) returning id,name',[required(o,'name'),required(o,'customer'),required(o,'owner'),b.id,date(required(o,'expires'))]))[0];await audit(db,out.id,actor,cmd,'Draft created');}
 else{
 const q=await lock(db,reference);
 if(['add-line','quantity','discount','terms','revise','cost-review'].includes(cmd)){
 if(cmd!=='revise')editable(q);
 await audit(db,q.id,actor,'revision-snapshot',JSON.stringify(await detail(db,q.id)));
 if(cmd==='cost-review'){const p=await resolve(db,'products',required(o,'product'));required(o,'reason');const found=await db.query('update quote_lines set cost_cents=$1 where quote_id=$2 and product_id=$3 returning id',[integer(required(o,'cost-cents'),'cost'),q.id,p.id]);if(!found.length)throw Error('Product is not on quote');}
 if(cmd==='add-line'){const p=await resolve(db,'products',required(o,'product'));const e=(await db.query('select e.*,b.currency from prices e join pricebooks b on b.id=e.pricebook_id where e.product_id=$1 and e.pricebook_id=$2 and e.active and b.active',[p.id,q.pricebook_id]))[0];if(!p.active||!e)throw Error('Active product price required in quote pricebook');await db.query('insert into quote_lines(quote_id,product_id,quantity,unit_cents,cost_cents) values($1,$2,$3,$4,$5)',[q.id,p.id,integer(required(o,'quantity'),'quantity',1,1000000),e.unit_cents,p.cost_currency===e.currency?p.cost_cents:null]);}
 if(cmd==='quantity'){const p=await resolve(db,'products',required(o,'product'));const rows=await db.query('update quote_lines set quantity=$1 where quote_id=$2 and product_id=$3 returning id',[integer(required(o,'quantity'),'quantity',1,1000000),q.id,p.id]);if(!rows.length)throw Error('Product is not on this quote');}
 if(cmd==='discount'){const p=await resolve(db,'products',required(o,'product'));const rows=await db.query('update quote_lines set discount_bps=$1 where quote_id=$2 and product_id=$3 returning id',[integer(required(o,'bps'),'discount bps',0,10000),q.id,p.id]);if(!rows.length)throw Error('Product is not on this quote');}
 if(cmd==='terms')await db.query('update quotes set terms=$1,tax_bps=$2,tax_note=$3,expires=$4 where id=$5',[required(o,'terms'),integer(required(o,'tax-bps'),'tax bps',0,10000),required(o,'tax-note'),date(required(o,'expires')),q.id]);
 if(cmd==='revise'){
 required(o,'reason');
 }
 await invalidate(db,q);
 }else if(cmd==='approve'){
 editable(q);await checkReady(db,q);await db.query('insert into approvals(quote_id,revision,actor,reason) values($1,$2,$3,$4)',[q.id,q.revision,actor,required(o,'reason')]);await db.query("update quotes set status='approved' where id=$1",[q.id]);
 }else if(cmd==='mark-issued'){
 if(q.status!=='approved')throw Error('Approve current revision before recording issue');await checkReady(db,q);
 if(!(await db.query('select id from approvals where quote_id=$1 and revision=$2',[q.id,q.revision])).length)throw Error('Current approval missing');
 await audit(db,q.id,actor,'issued-snapshot',JSON.stringify(await detail(db,q.id)));await db.query("update quotes set status='issued' where id=$1",[q.id]);
 }else if(cmd==='log'){await db.query('update quotes set last_contact=current_date where id=$1',[q.id]);required(o,'note');}
 else throw Error(`Unhandled ${cmd}`);
 await audit(db,q.id,actor,cmd,JSON.stringify(o));out=await detail(db,q.id);
 }
 if(o['dry-run']){if(cmd!=='import')throw Error('--dry-run is supported only for import');await db.exec('rollback');}else await db.exec('commit');
 return out;
 }catch(e){await db.exec('rollback');throw e;}
}
export function human(value){if(Array.isArray(value)){if(!value.length)return '(none)';return table(value,Object.keys(value[0]).map(key=>({key,label:key.replace(/_cents$/, '').replace(/_bps$/, ' %').replaceAll('_',' '),width:key==='id'?8:52,format:v=>v==null?'':key.endsWith('_cents')?(Number(v)/100).toFixed(2):key.endsWith('_bps')?(Number(v)/100).toFixed(2)+'%':typeof v==='boolean'?(v?'yes':'no'):v})));}if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>typeof v==='object'&&v!==null?k+'\n'+human(Array.isArray(v)?v:[v]):k+': '+v).join('\n\n');return String(value);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):human(result));}catch(e){if(process.argv.includes('--json'))console.error(JSON.stringify({error:e.message}));else console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
