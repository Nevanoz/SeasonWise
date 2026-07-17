-- Synthetic local demo only. Do not run this file against production.
-- Demo login: demo@musimaman.local / Demo123!ChangeMe
-- To attach the demo to your existing local account, replace every occurrence of
-- 11111111-1111-4111-8111-111111111111 with your auth.users UUID.
-- Find it with: select id, email from auth.users order by created_at desc;
-- Duplicate the plan block with new UUIDs to create additional seeded plans.

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
values ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-111111111111','authenticated','authenticated','demo@musimaman.local',crypt('Demo123!ChangeMe',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"synthetic":true}',now(),now(),'','','','')
on conflict (id) do nothing;

insert into auth.identities (provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at,id)
values ('11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@musimaman.local"}','email',now(),now(),now(),'21111111-1111-4111-8111-111111111111')
on conflict (provider_id,provider) do nothing;

insert into public.plans (id,owner_id,title,province_code,regency_code,district_code,schema_version,status,source,monthly_household_expense_rupiah,opening_balance_rupiah,emergency_reserve_rupiah,notes)
values ('31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Demo Sintetis Rencana Padi Juli','32','32.04',null,1,'complete','seed',1000000,1000000,500000,'Data simulasi/sintetis untuk presentasi MusimAman.')
on conflict (id) do update set title=excluded.title,updated_at=now();

insert into public.crop_plans (id,plan_id,owner_id,crop_type,template_version,planting_date,estimated_harvest_date,cycle_duration_days,production_phases,expected_harvest_quantity,quantity_unit,expected_selling_price_rupiah,expected_total_harvest_income_rupiah,assumptions)
values ('41111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','rice','demo-rice-v1','2026-07-01','2026-10-20',112,'["Persiapan lahan","Tanam","Pemeliharaan","Panen"]',3000,'kg',6500,19500000,'["Data simulasi/sintetis","Siklus empat bulan","Harga dapat diedit"]')
on conflict (plan_id) do update set updated_at=now();

delete from public.cash_flow_items where plan_id='31111111-1111-4111-8111-111111111111';
insert into public.cash_flow_items (id,plan_id,owner_id,item_type,category,amount_rupiah,timing_date,description,is_harvest_income) values
('51111111-1111-4111-8111-111111111101','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','land_preparation',1200000,'2026-07-05','Persiapan lahan sintetis',false),
('51111111-1111-4111-8111-111111111102','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','seed',600000,'2026-07-10','Benih sintetis',false),
('51111111-1111-4111-8111-111111111103','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','labor',800000,'2026-07-15','Tenaga kerja awal',false),
('51111111-1111-4111-8111-111111111104','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','fertilizer',1000000,'2026-08-05','Pupuk tahap satu',false),
('51111111-1111-4111-8111-111111111105','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','irrigation',400000,'2026-08-12','Irigasi',false),
('51111111-1111-4111-8111-111111111106','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','labor',800000,'2026-08-18','Tenaga kerja pemeliharaan',false),
('51111111-1111-4111-8111-111111111107','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','fertilizer',800000,'2026-09-05','Pupuk tahap dua',false),
('51111111-1111-4111-8111-111111111108','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','irrigation',400000,'2026-09-12','Irigasi',false),
('51111111-1111-4111-8111-111111111109','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','labor',800000,'2026-09-18','Tenaga kerja pemeliharaan',false),
('51111111-1111-4111-8111-111111111110','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','production_expense','transport',500000,'2026-10-18','Transport panen',false),
('51111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','income','harvest',19500000,'2026-10-20','Pendapatan panen sintetis',true);

delete from public.financing_options where plan_id='31111111-1111-4111-8111-111111111111';
insert into public.financing_options (id,plan_id,owner_id,name,principal_rupiah,interest_rate_bps,interest_period,administration_fee_rupiah,other_upfront_fees_rupiah,financing_start_date,grace_period_months,number_of_installments,repayment_frequency,repayment_structure,first_repayment_date) values
('61111111-1111-4111-8111-111111111101','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Cicilan bulanan flat',12000000,100,'MONTHLY',100000,0,'2026-07-01',0,4,'MONTHLY','FLAT_MONTHLY','2026-09-15'),
('61111111-1111-4111-8111-111111111102','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Pembayaran pascapanen',12000000,1200,'ANNUAL',100000,0,'2026-07-01',0,1,'ONCE','BULLET','2026-11-15');

delete from public.scenario_configs where plan_id='31111111-1111-4111-8111-111111111111';
insert into public.scenario_configs (id,plan_id,owner_id,name,mode,enabled_harvest_delay,harvest_delay_months,config_version) values
('71111111-1111-4111-8111-111111111101','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Expected','EXPECTED',false,0,'prototype-1'),
('71111111-1111-4111-8111-111111111102','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Panen terlambat satu bulan','CUSTOM',true,1,'prototype-1');

delete from public.calculation_snapshots where plan_id='31111111-1111-4111-8111-111111111111';
insert into public.calculation_snapshots (id,plan_id,owner_id,financing_option_id,original_input,normalized_input,result,scenario_config,engine_version,risk_config_version,input_checksum) values
('81111111-1111-4111-8111-111111111101','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','61111111-1111-4111-8111-111111111101','{"demoDataVersion":1,"synthetic":true}','{"planStartDate":"2026-07-01","planEndDate":"2026-12-31"}','{"minimumBalanceRupiah":480000,"maximumCashGapRupiah":0,"firstCashGapMonth":null,"totalFinancingPaymentRupiah":12480000,"totalInterestRupiah":480000,"totalFeesRupiah":100000,"totalFinancingCostRupiah":580000,"endingBalanceRupiah":7120000,"assumptions":["Data simulasi/sintetis"]}','{"mode":"EXPECTED","harvestDelayMonths":0}','1.0.0','prototype-1','sha256:demo-rice-v1-monthly-expected'),
('81111111-1111-4111-8111-111111111102','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','61111111-1111-4111-8111-111111111101','{"demoDataVersion":1,"synthetic":true}','{"planStartDate":"2026-07-01","planEndDate":"2026-12-31"}','{"minimumBalanceRupiah":-4140000,"maximumCashGapRupiah":4140000,"firstCashGapMonth":"2026-10","totalFinancingPaymentRupiah":12480000,"totalInterestRupiah":480000,"totalFeesRupiah":100000,"totalFinancingCostRupiah":580000,"endingBalanceRupiah":7120000,"assumptions":["Panen terlambat satu bulan","Data simulasi/sintetis"]}','{"mode":"CUSTOM","harvestDelayMonths":1}','1.0.0','prototype-1','sha256:demo-rice-v1-monthly-delay-1'),
('81111111-1111-4111-8111-111111111103','31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','61111111-1111-4111-8111-111111111102','{"demoDataVersion":1,"synthetic":true}','{"planStartDate":"2026-07-01","planEndDate":"2026-12-31"}','{"minimumBalanceRupiah":2100000,"maximumCashGapRupiah":0,"firstCashGapMonth":null,"totalFinancingPaymentRupiah":12480000,"totalInterestRupiah":480000,"totalFeesRupiah":100000,"totalFinancingCostRupiah":580000,"endingBalanceRupiah":7120000,"assumptions":["Panen terlambat satu bulan","Pembayaran pascapanen","Data simulasi/sintetis"]}','{"mode":"CUSTOM","harvestDelayMonths":1}','1.0.0','prototype-1','sha256:demo-rice-v1-bullet-delay-1');