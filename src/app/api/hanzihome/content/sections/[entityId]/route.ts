import {
 createItemDelete,
 createItemPatch,
} from "@/features/hanzihome/server/content-route-factory";

export const dynamic = "force-dynamic";
export const PATCH = createItemPatch("section");
export const DELETE = createItemDelete("section");
