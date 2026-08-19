import {
 createItemDelete,
 createItemPatch,
} from "@/features/hanzihome/server/content-route-factory";

export const dynamic = "force-dynamic";
export const PATCH = createItemPatch("vocab_example");
export const DELETE = createItemDelete("vocab_example");
