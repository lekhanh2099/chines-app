"use client";

import { useState, type FormEvent, type Ref } from "react";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Input } from "@/components/ui/forms/input";
import { useRouter } from "@/i18n/navigation";

import { parseYoutubeVideoId } from "../model/youtube-video-id";

const youtubeLinkFormDensitySchema = z.enum(["default", "compact"]);
type YoutubeLinkFormDensity = z.infer<typeof youtubeLinkFormDensitySchema>;

export function YoutubeLinkForm({
 initialValue = "",
 density = youtubeLinkFormDensitySchema.enum.default,
 inputRef,
 onSubmitted,
}: {
 initialValue?: string;
 density?: YoutubeLinkFormDensity;
 inputRef?: Ref<HTMLInputElement>;
 onSubmitted?: () => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const router = useRouter();
 const [value, setValue] = useState(initialValue);
 const [hasError, setHasError] = useState(false);

 const isCompact = density === youtubeLinkFormDensitySchema.enum.compact;

 function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const parsedId = parseYoutubeVideoId(value);
  if (!parsedId) {
   setHasError(true);
   return;
  }

  setHasError(false);
  onSubmitted?.();
  router.push(`/shadowing?v=${parsedId}`);
 }

 return (
  <form onSubmit={handleSubmit} className="grid min-w-0 gap-2" noValidate>
   <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
    <Input
     ref={inputRef}
     type="url"
     value={value}
     onChange={(event) => {
      setValue(event.target.value);
      if (hasError) setHasError(false);
     }}
     density={isCompact ? "compact" : "default"}
     validation={hasError ? "danger" : "none"}
     placeholder={t("linkForm.placeholder")}
     aria-label={t("linkForm.inputAria")}
     aria-invalid={hasError ? "true" : undefined}
     className="min-w-0 flex-1"
    />
    <Button
     type="submit"
     variant="default"
     size={isCompact ? "toolbar" : "touch"}
     className="shrink-0"
    >
     <Play data-icon="inline-start" aria-hidden="true" />
     {t("linkForm.submit")}
    </Button>
   </div>
   {hasError ? (
    <Typography as="p" variant="caption" tone="danger" role="alert">
     {t("linkForm.invalidUrl")}
    </Typography>
   ) : null}
  </form>
 );
}
