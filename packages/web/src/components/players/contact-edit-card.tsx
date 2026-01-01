import { Mail, MessageCircle, Phone } from "lucide-react";
import { createContext, useContext, useMemo } from "react";
import type { Control, FieldValues, UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@laxdb/ui/components/ui/field";
import { Input } from "@laxdb/ui/components/ui/input";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  SOCIAL_PLATFORM_CONFIG,
} from "@laxdb/ui/components/social-icons";

type ContactEditCardContextValue = {
  control: Control;
  name: string;
  label: string;
  prefix: string | undefined;
};

const ContactEditCardContext =
  createContext<ContactEditCardContextValue | null>(null);

function useContactEditCard(): ContactEditCardContextValue {
  const context = useContext(ContactEditCardContext);
  if (!context) {
    throw new Error(
      "ContactEditCard components must be used within ContactEditCard",
    );
  }
  return context;
}

type ContactEditCardProps<T extends FieldValues> = {
  children: React.ReactNode;
  form: UseFormReturn<T>;
  name: string;
  label: string;
  prefix?: string;
};

function eraseControlType<T extends FieldValues>(control: Control<T>): Control {
  // oxlint-disable-next-line no-unsafe-type-assertion - needed to erase type information
  return control as unknown as Control;
}

function ContactEditCard<T extends FieldValues>({
  children,
  form,
  name,
  label,
  prefix,
}: ContactEditCardProps<T>) {
  const value = useMemo(
    (): ContactEditCardContextValue => ({
      control: eraseControlType(form.control),
      name,
      label,
      prefix,
    }),
    [form.control, name, label, prefix],
  );

  return (
    <ContactEditCardContext.Provider value={value}>
      {children}
    </ContactEditCardContext.Provider>
  );
}

function ContactEditCardField() {
  const { control, name, prefix, label } = useContactEditCard();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel
            htmlFor={`contact-${name}`}
            className="font-medium text-muted-foreground text-xs"
          >
            {label}
          </FieldLabel>
          <ContactEditCardInput
            field={field}
            icon={null}
            prefix={prefix}
            id={`contact-${name}`}
            isInvalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

function ContactEditCardLabel() {
  const { label, name } = useContactEditCard();
  return (
    <FieldLabel
      htmlFor={`contact-${String(name)}`}
      className="font-medium text-muted-foreground text-xs"
    >
      {label}
    </FieldLabel>
  );
}

type ContactEditCardInputProps = {
  icon: React.ReactNode;
  prefix?: string | undefined;
  field: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    name: string;
    ref: React.Ref<HTMLInputElement>;
  };
  id?: string;
  isInvalid?: boolean;
};

function ContactEditCardInput({
  icon,
  prefix,
  field,
  id,
  isInvalid,
}: ContactEditCardInputProps) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      {prefix ? (
        <div className="flex flex-1 items-center rounded-md border">
          <span className="flex h-8 items-center border-r bg-muted px-3 text-muted-foreground text-sm">
            {prefix}
          </span>
          <Input
            {...field}
            id={id}
            aria-invalid={isInvalid}
            className="h-8 border-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      ) : (
        <Input
          {...field}
          id={id}
          aria-invalid={isInvalid}
          className="h-8 text-sm"
        />
      )}
    </div>
  );
}

type ContactEditCardIconProps = {
  children: React.ReactNode;
};

function ContactEditCardIcon({ children }: ContactEditCardIconProps) {
  const { control, name, prefix, label } = useContactEditCard();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel
            htmlFor={`contact-${name}`}
            className="font-medium text-muted-foreground text-xs"
          >
            {label}
          </FieldLabel>
          <ContactEditCardInput
            field={field}
            icon={children}
            prefix={prefix}
            id={`contact-${name}`}
            isInvalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

type EmailEditCardProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function EmailEditCard<T extends FieldValues>({
  form,
}: EmailEditCardProps<T>) {
  return (
    <ContactEditCard form={form} label="Email" name="email">
      <ContactEditCardIcon>
        <Mail className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type PhoneEditCardProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function PhoneEditCard<T extends FieldValues>({
  form,
}: PhoneEditCardProps<T>) {
  return (
    <ContactEditCard form={form} label="Phone" name="phone">
      <ContactEditCardIcon>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type FacebookEditCardProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function FacebookEditCard<T extends FieldValues>({
  form,
}: FacebookEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      label="Facebook"
      name={"facebook"}
      prefix={SOCIAL_PLATFORM_CONFIG.facebook.prefix}
    >
      <ContactEditCardIcon>
        <FacebookIcon className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type InstagramEditCardProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function InstagramEditCard<T extends FieldValues>({
  form,
}: InstagramEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      label="Instagram"
      name={"instagram"}
      prefix={SOCIAL_PLATFORM_CONFIG.instagram.prefix}
    >
      <ContactEditCardIcon>
        <InstagramIcon className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type WhatsAppEditCardProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function WhatsAppEditCard<T extends FieldValues>({
  form,
}: WhatsAppEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      label="WhatsApp"
      name={"whatsapp"}
      prefix={SOCIAL_PLATFORM_CONFIG.whatsapp.prefix}
    >
      <ContactEditCardIcon>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type GroupMeEditCardProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function GroupMeEditCard<T extends FieldValues>({
  form,
}: GroupMeEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      label="GroupMe"
      name={"groupme"}
      prefix={SOCIAL_PLATFORM_CONFIG.groupme.prefix}
    >
      <ContactEditCardIcon>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type LinkedInEditCardProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function LinkedInEditCard<T extends FieldValues>({
  form,
}: LinkedInEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      label="LinkedIn"
      name={"linkedin"}
      prefix={SOCIAL_PLATFORM_CONFIG.linkedin.prefix}
    >
      <ContactEditCardIcon>
        <LinkedInIcon className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type EmergencyContactNameEditCardProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function EmergencyContactNameEditCard<T extends FieldValues>({
  form,
}: EmergencyContactNameEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      label="Emergency Contact Name"
      name={"emergencyContactName"}
    >
      <ContactEditCardIcon>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type EmergencyContactPhoneEditCardProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function EmergencyContactPhoneEditCard<T extends FieldValues>({
  form,
}: EmergencyContactPhoneEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      label="Emergency Contact Phone"
      name={"emergencyContactPhone"}
    >
      <ContactEditCardIcon>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

export {
  ContactEditCard,
  ContactEditCardField,
  ContactEditCardLabel,
  ContactEditCardInput,
  ContactEditCardIcon,
};
