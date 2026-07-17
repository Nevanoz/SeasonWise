create or replace function public.insert_plan_children(p_plan_id uuid, p_owner_id uuid, p_plan jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare
  item jsonb;
  option_item jsonb;
  crop jsonb := p_plan->'cropPlan';
begin
  if p_owner_id <> auth.uid() or not exists(select 1 from plans where id=p_plan_id and owner_id=p_owner_id) then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  insert into crop_plans(plan_id,owner_id,crop_type,template_version,planting_date,estimated_harvest_date,cycle_duration_days,production_phases,expected_harvest_quantity,quantity_unit,expected_selling_price_rupiah,expected_total_harvest_income_rupiah,assumptions)
  values(p_plan_id,p_owner_id,crop->>'cropType',coalesce(crop->>'templateVersion','v1'),(crop->>'plantingDate')::date,(crop->>'estimatedHarvestDate')::date,(crop->>'cycleDurationDays')::int,coalesce(crop->'productionPhases','[]'),(crop->>'expectedHarvestQuantity')::numeric,crop->>'quantityUnit',(crop->>'expectedSellingPriceRupiah')::bigint,coalesce((crop->>'expectedTotalHarvestIncomeRupiah')::bigint,round((crop->>'expectedHarvestQuantity')::numeric*(crop->>'expectedSellingPriceRupiah')::numeric)::bigint),coalesce(crop->'assumptions','[]'));

  for item in select value from jsonb_array_elements(p_plan->'cashFlowItems') loop
    insert into cash_flow_items(id,plan_id,owner_id,item_type,category,amount_rupiah,timing_date,description,is_harvest_income)
    values(coalesce((item->>'id')::uuid,gen_random_uuid()),p_plan_id,p_owner_id,item->>'type',item->>'category',(item->>'amountRupiah')::bigint,(item->>'timingDate')::date,item->>'description',coalesce((item->>'isHarvestIncome')::boolean,false));
  end loop;

  for option_item in select value from jsonb_array_elements(p_plan->'financingOptions') loop
    insert into financing_options(id,plan_id,owner_id,name,principal_rupiah,interest_rate_bps,interest_period,administration_fee_rupiah,other_upfront_fees_rupiah,financing_start_date,grace_period_months,number_of_installments,repayment_frequency,repayment_structure,first_repayment_date)
    values(coalesce((option_item->>'id')::uuid,gen_random_uuid()),p_plan_id,p_owner_id,option_item->>'name',(option_item->>'principalRupiah')::bigint,(option_item->>'interestRateBps')::int,option_item->>'interestPeriod',coalesce((option_item->>'administrationFeeRupiah')::bigint,0),coalesce((option_item->>'otherUpfrontFeesRupiah')::bigint,0),(option_item->>'financingStartDate')::date,0,(option_item->>'numberOfInstallments')::int,option_item->>'repaymentFrequency',option_item->>'repaymentStructure',(option_item->>'firstRepaymentDate')::date);
  end loop;
end $$;

create or replace function public.create_plan(p_plan jsonb,p_source text default 'new')
returns jsonb language plpgsql security invoker set search_path = public as $$
declare owner uuid:=auth.uid(); new_id uuid; changed timestamptz;
begin
  if owner is null then raise exception 'UNAUTHENTICATED'; end if;
  insert into plans(owner_id,title,province_code,regency_code,district_code,schema_version,source,monthly_household_expense_rupiah,opening_balance_rupiah,emergency_reserve_rupiah,notes)
  values(owner,p_plan->>'title',p_plan#>>'{region,provinceCode}',p_plan#>>'{region,regencyCode}',nullif(p_plan#>>'{region,districtCode}',''),(p_plan->>'schemaVersion')::int,p_source,(p_plan->>'monthlyHouseholdExpenseRupiah')::bigint,(p_plan->>'openingBalanceRupiah')::bigint,(p_plan->>'emergencyReserveRupiah')::bigint,p_plan->>'notes')
  returning id,updated_at into new_id,changed;
  perform insert_plan_children(new_id,owner,p_plan);
  return jsonb_build_object('id',new_id,'updatedAt',changed,'schemaVersion',(p_plan->>'schemaVersion')::int);
end $$;

create or replace function public.get_plan(p_plan_id uuid)
returns jsonb language sql stable security invoker set search_path = public as $$
select jsonb_build_object(
  'id',p.id,
  'updatedAt',p.updated_at,
  'plan',jsonb_build_object(
    'schemaVersion',p.schema_version,'title',p.title,
    'region',jsonb_build_object('provinceCode',p.province_code,'regencyCode',p.regency_code,'districtCode',p.district_code),
    'cropPlan',(select jsonb_build_object('cropType',c.crop_type,'templateVersion',c.template_version,'plantingDate',c.planting_date,'estimatedHarvestDate',c.estimated_harvest_date,'cycleDurationDays',c.cycle_duration_days,'productionPhases',c.production_phases,'expectedHarvestQuantity',c.expected_harvest_quantity,'quantityUnit',c.quantity_unit,'expectedSellingPriceRupiah',c.expected_selling_price_rupiah,'expectedTotalHarvestIncomeRupiah',c.expected_total_harvest_income_rupiah,'assumptions',c.assumptions) from crop_plans c where c.plan_id=p.id),
    'cashFlowItems',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'type',i.item_type,'category',i.category,'amountRupiah',i.amount_rupiah,'timingDate',i.timing_date,'description',i.description,'isHarvestIncome',i.is_harvest_income) order by i.timing_date,i.id),'[]') from cash_flow_items i where i.plan_id=p.id),
    'monthlyHouseholdExpenseRupiah',p.monthly_household_expense_rupiah,'openingBalanceRupiah',p.opening_balance_rupiah,'emergencyReserveRupiah',p.emergency_reserve_rupiah,
    'financingOptions',(select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'principalRupiah',f.principal_rupiah,'interestRateBps',f.interest_rate_bps,'interestPeriod',f.interest_period,'administrationFeeRupiah',f.administration_fee_rupiah,'otherUpfrontFeesRupiah',f.other_upfront_fees_rupiah,'financingStartDate',f.financing_start_date,'gracePeriodMonths',f.grace_period_months,'numberOfInstallments',f.number_of_installments,'repaymentFrequency',f.repayment_frequency,'repaymentStructure',f.repayment_structure,'firstRepaymentDate',f.first_repayment_date) order by f.created_at,f.id),'[]') from financing_options f where f.plan_id=p.id),
    'notes',p.notes
  ),
  'latestSnapshot',(select s.result from calculation_snapshots s where s.plan_id=p.id order by s.created_at desc limit 1)
) from plans p where p.id=p_plan_id and p.owner_id=auth.uid() and p.deleted_at is null;
$$;

create or replace function public.replace_plan(p_plan_id uuid,p_expected_updated_at timestamptz,p_plan jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare owner uuid:=auth.uid(); current_row plans%rowtype; changed timestamptz;
begin
  select * into current_row from plans where id=p_plan_id and owner_id=owner and deleted_at is null for update;
  if not found then raise exception 'PLAN_NOT_FOUND'; end if;
  if current_row.updated_at <> p_expected_updated_at then raise exception 'PLAN_VERSION_CONFLICT'; end if;
  update plans set title=p_plan->>'title',province_code=p_plan#>>'{region,provinceCode}',regency_code=p_plan#>>'{region,regencyCode}',district_code=nullif(p_plan#>>'{region,districtCode}',''),schema_version=(p_plan->>'schemaVersion')::int,monthly_household_expense_rupiah=(p_plan->>'monthlyHouseholdExpenseRupiah')::bigint,opening_balance_rupiah=(p_plan->>'openingBalanceRupiah')::bigint,emergency_reserve_rupiah=(p_plan->>'emergencyReserveRupiah')::bigint,notes=p_plan->>'notes' where id=p_plan_id returning updated_at into changed;
  delete from crop_plans where plan_id=p_plan_id;
  delete from cash_flow_items where plan_id=p_plan_id;
  delete from financing_options where plan_id=p_plan_id;
  delete from scenario_configs where plan_id=p_plan_id;
  perform insert_plan_children(p_plan_id,owner,p_plan);
  return jsonb_build_object('id',p_plan_id,'updatedAt',changed,'schemaVersion',(p_plan->>'schemaVersion')::int);
end $$;

create or replace function public.duplicate_plan(p_plan_id uuid,p_title text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare original jsonb; payload jsonb;
begin
  original:=get_plan(p_plan_id);
  if original is null then raise exception 'PLAN_NOT_FOUND'; end if;
  payload:=jsonb_set(original->'plan','{title}',to_jsonb(p_title));
  payload:=jsonb_set(payload,'{cashFlowItems}',(select coalesce(jsonb_agg(value-'id'),'[]') from jsonb_array_elements(payload->'cashFlowItems')));
  payload:=jsonb_set(payload,'{financingOptions}',(select coalesce(jsonb_agg(value-'id'),'[]') from jsonb_array_elements(payload->'financingOptions')));
  return create_plan(payload,'new');
end $$;

create or replace function public.soft_delete_plan(p_plan_id uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare changed timestamptz;
begin
  update plans set deleted_at=now() where id=p_plan_id and owner_id=auth.uid() and deleted_at is null returning deleted_at into changed;
  if changed is null then raise exception 'PLAN_NOT_FOUND'; end if;
  return jsonb_build_object('id',p_plan_id,'deletedAt',changed);
end $$;

revoke all on function public.insert_plan_children(uuid,uuid,jsonb) from public,anon;
revoke all on function public.create_plan(jsonb,text) from public,anon;
revoke all on function public.get_plan(uuid) from public,anon;
revoke all on function public.replace_plan(uuid,timestamptz,jsonb) from public,anon;
revoke all on function public.duplicate_plan(uuid,text) from public,anon;
revoke all on function public.soft_delete_plan(uuid) from public,anon;
grant execute on function public.insert_plan_children(uuid,uuid,jsonb) to authenticated;
grant execute on function public.create_plan(jsonb,text) to authenticated;
grant execute on function public.get_plan(uuid) to authenticated;
grant execute on function public.replace_plan(uuid,timestamptz,jsonb) to authenticated;
grant execute on function public.duplicate_plan(uuid,text) to authenticated;
grant execute on function public.soft_delete_plan(uuid) to authenticated;