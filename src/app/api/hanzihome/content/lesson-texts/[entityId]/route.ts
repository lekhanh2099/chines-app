import {
 createItemDelete,
 createItemPatch,
} from "@/features/hanzihome/server/content-route-factory";

export const dynamic = "force-dynamic";
export const PATCH = createItemPatch("lesson_text");
export const DELETE = createItemDelete("lesson_text");
