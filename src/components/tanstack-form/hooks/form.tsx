import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./form-context";
import { TextField } from "@/components/tanstack-form/field/TextField";
import { TextareaField } from "@/components/tanstack-form/field/TextareaField";
import { Wrapper } from "@/components/tanstack-form/form/Wrapper";
import { SubscribeButton } from "@/components/tanstack-form/form/SubscribeButton";
import { SelectField } from "@/components/tanstack-form/field/SelectField";
import { CheckboxField } from "@/components/tanstack-form/field/CheckboxField";
import { RadioField } from "@/components/tanstack-form/field/RadioField";
import { CalendarField } from "@/components/tanstack-form/field/Calendar";
import { SwitchField } from "@/components/tanstack-form/field/SwitchField";
import { PasswordField } from "@/components/tanstack-form/field/PasswordField";
import { Header } from "@/components/tanstack-form/form/Header";
import { Footer } from "@/components/tanstack-form/form/Footer";
import { Body } from "@/components/tanstack-form/form/Body";
import { Title } from "@/components/tanstack-form/form/Title";
import { Description } from "@/components/tanstack-form/form/Description";

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
 formContext,
 fieldContext,
 formComponents: {
  Wrapper,
  SubscribeButton,
  Header,
  Footer,
  Body,
  Title,
  Description,
 },
 fieldComponents: {
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  RadioField,
  CalendarField,
  SwitchField,
  PasswordField,
 },
});
