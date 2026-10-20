"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { isHanziHomeMutationConflict } from "@/features/hanzihome/editing/mutation-error";
import { HanziInlineText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 saveLibraryCoverPayloadSchema,
 type LibraryCover,
 type SaveLibraryCoverPayload,
} from "./library-cover.schema";
import {
 useLibraryCovers,
 useResetLibraryCoverMutation,
 useSaveLibraryCoverMutation,
} from "./useLibraryCovers";

export function LibraryCoverDialog({
 collectionId,
 title,
 character,
 cover,
 onOpenChange,
 onClosed,
}: {
 collectionId: string;
 title: string;
 character: string;
 cover?: LibraryCover;
 onOpenChange: (open: boolean) => void;
 onClosed: () => void;
}) {
 const t = useTranslations("Common.library.cover");
 const coversQuery = useLibraryCovers();
 const saveMutation = useSaveLibraryCoverMutation();
 const resetMutation = useResetLibraryCoverMutation();
 const [initialValues, setInitialValues] = useState<SaveLibraryCoverPayload>(() => ({
  coverUrl: cover?.coverUrl ?? "",
  ...(cover ? { expectedUpdatedAt: cover.updatedAt } : {}),
 }));
 const [confirmDiscard, setConfirmDiscard] = useState(false);
 const [confirmReload, setConfirmReload] = useState(false);
 const [failedPreview, setFailedPreview] = useState("");
 const cancelButtonRef = useRef<HTMLButtonElement>(null);
 const form = useAppForm({
  defaultValues: initialValues,
  validators: { onSubmit: saveLibraryCoverPayloadSchema },
  onSubmit: async ({ value }) => {
   resetMutation.reset();
   try {
    await saveMutation.mutateAsync({ collectionId, input: value });
    toast.success(t("saved"));
    onOpenChange(false);
   } catch {
    // The mutation error remains visible and the form keeps its draft and revision.
   }
  },
 });
 const mutationError = saveMutation.error ?? resetMutation.error;
 const isConflict = isHanziHomeMutationConflict(mutationError);
 const isPending = saveMutation.isPending || resetMutation.isPending || coversQuery.isFetching;

 function requestClose() {
  if (isPending || form.state.isSubmitting) return;
  if (form.state.isDirty) setConfirmDiscard(true);
  else onOpenChange(false);
 }

 async function reloadCover() {
  const result = await coversQuery.refetch();
  if (!result.isSuccess) return;
  const latest = result.data.find((item) => item.collectionId === collectionId);
  const values: SaveLibraryCoverPayload = {
   coverUrl: latest?.coverUrl ?? "",
   ...(latest ? { expectedUpdatedAt: latest.updatedAt } : {}),
  };
  setInitialValues(values);
  form.reset(values);
  saveMutation.reset();
  resetMutation.reset();
  setFailedPreview("");
 }

 async function resetCover() {
  const expectedUpdatedAt = form.state.values.expectedUpdatedAt;
  if (!expectedUpdatedAt) return;
  saveMutation.reset();
  try {
   await resetMutation.mutateAsync({ collectionId, input: { expectedUpdatedAt } });
   toast.success(t("resetSaved"));
   onOpenChange(false);
  } catch {
   // The mutation owns the visible error; keep the draft open for retry or reload.
  }
 }

 return (
  <>
   <Dialog
    open
    onOpenChange={(open) => {
     if (!open) requestClose();
    }}
   >
    <DialogContent
     size="sm"
     closeLabel={t("close")}
     showCloseButton={!isPending}
     onCloseAutoFocus={(event) => {
      event.preventDefault();
      onClosed();
     }}
    >
     <DialogHeader>
      <DialogTitle>{t("title", { title })}</DialogTitle>
      <DialogDescription>{t("description")}</DialogDescription>
     </DialogHeader>
     <form
      className="flex min-h-0 flex-col"
      onSubmit={(event) => {
       event.preventDefault();
       if (isPending || form.state.isSubmitting) return;
       void form.handleSubmit();
      }}
     >
      <DialogBody>
       <form.AppField
        name="coverUrl"
        validators={{
         onChange: ({ value }) =>
          saveLibraryCoverPayloadSchema.shape.coverUrl.safeParse(value).success
           ? undefined
           : t("invalidUrl"),
        }}
       >
        {(field) => (
         <field.TextField
          label={t("urlLabel")}
          description={t("urlHint")}
          type="url"
          required
          disabled={isPending}
         />
        )}
       </form.AppField>
       <form.Subscribe selector={(state) => state.values.coverUrl}>
        {(coverUrl) => {
         const parsed = saveLibraryCoverPayloadSchema.shape.coverUrl.safeParse(coverUrl);
         const previewUrl = parsed.success ? parsed.data : "";
         const previewFailed = Boolean(previewUrl) && failedPreview === previewUrl;
         return (
          <div className="grid gap-2">
           <Typography as="p" variant="label">
            {previewUrl && !previewFailed ? t("preview") : t("commonPreview")}
           </Typography>
           <div className="relative mx-auto aspect-[4/5] w-full max-w-48">
            <Image
             key={previewUrl && !previewFailed ? previewUrl : "common"}
             src={previewUrl && !previewFailed ? previewUrl : "/textbooks/common-cover.svg"}
             alt=""
             width={600}
             height={750}
             unoptimized
             className="size-full object-cover"
             onError={() => {
              if (previewUrl) setFailedPreview(previewUrl);
             }}
            />
            {!previewUrl || previewFailed ? (
             <span aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
              <svg viewBox="0 0 600 750" className="size-full" color="#24384b">
               <foreignObject x="92" y="94" width="180" height="170">
                <span className="block text-left font-serif text-2xl leading-snug tracking-wide whitespace-normal uppercase wrap-break-word">
                 <HanziInlineText text={title} />
                </span>
               </foreignObject>
               <text
                x="398"
                y="350"
                textAnchor="middle"
                fontSize="320"
                fill="currentColor"
                lang="zh-CN"
                className="font-hanzi"
               >
                {character}
               </text>
              </svg>
             </span>
            ) : null}
           </div>
           {previewFailed ? (
            <Typography as="p" variant="bodySmall" tone="danger" role="alert">
             {t("previewError")}
            </Typography>
           ) : null}
          </div>
         );
        }}
       </form.Subscribe>
       {coversQuery.isError ? (
        <Typography as="p" variant="bodySmall" tone="danger" role="alert">
         {t("loadError")}
        </Typography>
       ) : null}
       {mutationError ? (
        <Typography as="p" variant="bodySmall" tone="danger" role="alert">
         {isConflict ? t("conflict") : resetMutation.error ? t("resetError") : t("saveError")}
        </Typography>
       ) : null}
       <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => {
         if (form.state.isDirty) setConfirmReload(true);
         else void reloadCover();
        }}
       >
        {coversQuery.isFetching ? t("reloading") : t("reload")}
       </Button>
      </DialogBody>
      <form.Subscribe
       selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
        expectedUpdatedAt: state.values.expectedUpdatedAt,
       })}
      >
       {({ canSubmit, isSubmitting, expectedUpdatedAt }) => (
        <DialogFooter>
         {expectedUpdatedAt ? (
          <Button
           type="button"
           variant="outline"
           disabled={isPending || isSubmitting || coversQuery.isError || isConflict}
           onClick={() => void resetCover()}
          >
           {resetMutation.isPending ? t("resetting") : t("useCommon")}
          </Button>
         ) : null}
         <Button
          ref={cancelButtonRef}
          type="button"
          variant="outline"
          disabled={isPending || isSubmitting}
          onClick={requestClose}
         >
          {t("cancel")}
         </Button>
         <Button
          type="submit"
          disabled={!canSubmit || isSubmitting || isPending || coversQuery.isError || isConflict}
         >
          {isSubmitting || saveMutation.isPending ? t("saving") : t("save")}
         </Button>
        </DialogFooter>
       )}
      </form.Subscribe>
     </form>
    </DialogContent>
   </Dialog>
   <Dialog
    open={confirmDiscard || confirmReload}
    onOpenChange={(open) => {
     if (!open) {
      setConfirmDiscard(false);
      setConfirmReload(false);
     }
    }}
   >
    <DialogContent
     size="sm"
     closeLabel={t("close")}
     onCloseAutoFocus={(event) => {
      event.preventDefault();
      if (cancelButtonRef.current?.isConnected) cancelButtonRef.current.focus();
     }}
    >
     <DialogHeader>
      <DialogTitle>{confirmReload ? t("reloadTitle") : t("discardTitle")}</DialogTitle>
      <DialogDescription>
       {confirmReload ? t("reloadDescription") : t("discardDescription")}
      </DialogDescription>
     </DialogHeader>
     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       onClick={() => {
        setConfirmDiscard(false);
        setConfirmReload(false);
       }}
      >
       {t("keepEditing")}
      </Button>
      <Button
       type="button"
       variant="destructive"
       onClick={() => {
        if (confirmReload) {
         setConfirmReload(false);
         void reloadCover();
        } else onOpenChange(false);
       }}
      >
       {confirmReload ? t("reload") : t("discard")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </>
 );
}
