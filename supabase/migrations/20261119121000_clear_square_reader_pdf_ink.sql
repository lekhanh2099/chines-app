-- Reader PDF ink was drawn on a layer that covered only a width-sized square
-- at the top of each page (a global `svg { block-size: auto }` reset beat the
-- layer's full height). The layer now covers the whole page, so those strokes
-- would be stretched to wrong positions. The owner asked to clear them.
-- Note PDF ink (asset_id 'note-pdf:%') was always drawn full-page and stays.
begin;
set local lock_timeout = '5s';

delete from public.hanzihome_pdf_annotations
where asset_id not like 'note-pdf:%';

commit;
