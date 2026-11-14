import {
 createItemDelete,
 createItemPatch,
} from "@/features/hanzihome/server/content-route-factory";

export const dynamic = "force-dynamic";
export const PATCH = createItemPatch("course");
export const DELETE = createItemDelete("course");
