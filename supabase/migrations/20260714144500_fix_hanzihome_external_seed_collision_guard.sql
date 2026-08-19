do $$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.hanzihome_import_external_seed_package(jsonb)'::regprocedure)
  into v_definition;

  v_definition := replace(v_definition, ' || value->>''id''', ' || (value->>''id'')');
  execute v_definition;
end;
$$;
