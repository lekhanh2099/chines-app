# HanziHome coverage matrix

| Surface             | Minimum proof                                                   |
| ------------------- | --------------------------------------------------------------- |
| Catalog/library     | pending, error+retry, true empty, summary-only payload          |
| Lesson selection    | selected ID in key, one detail payload, missing lesson          |
| Renderer family     | representative exact shape, sparse shape, unmapped fallback     |
| Form/dialog         | initial adapter, validation, dirty/reset, submit disabled/error |
| Node mutation       | owned fields accepted, parent/sibling fields rejected           |
| Route authorization | no session, wrong owner, wrong parent, valid owner              |
| Query invalidation  | smallest resource plus dependent lesson/catalog only            |
| Import              | count reconciliation, duplicate IDs, orphans, unmapped fields   |
| Migration           | existing-row safety, RLS/grants/RPC, generated type refresh     |
| Responsive overlay  | focus, keyboard, scroll lock, nested layer, no overflow         |
