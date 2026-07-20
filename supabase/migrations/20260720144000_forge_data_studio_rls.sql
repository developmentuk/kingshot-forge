create policy forge_dataset_contracts_authenticated_read on public.forge_dataset_contracts for select to authenticated using (active = true);
create policy forge_import_runs_owner_read on public.forge_import_runs for select to authenticated using (uploader_id = (select auth.uid()));
create policy forge_import_records_owner_read on public.forge_import_records for select to authenticated using (exists (select 1 from public.forge_import_runs run where run.id = import_run_id and run.uploader_id = (select auth.uid())));
