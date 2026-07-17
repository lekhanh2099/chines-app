alter function public.set_note_short_id() security definer;

comment on function public.set_note_short_id()
  is 'Assigns collision-safe note short IDs inside authenticated note inserts.';
