import {
 createItemDelete,
 createItemPatch,
} from "@/features/hanzihome/server/content-route-factory";

export const dynamic = "force-dynamic";
export const PATCH = createItemPatch("vocab_item");
export const DELETE = createItemDelete("vocab_item");
