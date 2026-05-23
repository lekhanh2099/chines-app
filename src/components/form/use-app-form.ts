"use client";

import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "@/components/form/form-context";
import { FormActions } from "@/components/form/fields/FormActions";
import { FormCheckbox } from "@/components/form/fields/FormCheckbox";
import { FormSelect } from "@/components/form/fields/FormSelect";
import { FormSwitch } from "@/components/form/fields/FormSwitch";
import { FormTextField } from "@/components/form/fields/FormTextField";
import { FormTextarea } from "@/components/form/fields/FormTextarea";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField: FormTextField,
    Textarea: FormTextarea,
    Select: FormSelect,
    Checkbox: FormCheckbox,
    Switch: FormSwitch,
  },
  formComponents: {
    Actions: FormActions,
  },
});
