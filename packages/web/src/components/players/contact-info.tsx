import type { PlayerWithContactInfoNonNullable } from "@laxdb/core/player/contact-info/contact-info.schema";
import { ArrowUpRightIcon, UserPen } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  EmailContactCard,
  EmergencyContactNameCard,
  EmergencyContactPhoneCard,
  FacebookContactCard,
  GroupMeContactCard,
  InstagramContactCard,
  LinkedInContactCard,
  PhoneContactCard,
  WhatsAppContactCard,
} from "@/components/players/contact-card";
import {
  EmailEditCard,
  EmergencyContactNameEditCard,
  EmergencyContactPhoneEditCard,
  FacebookEditCard,
  GroupMeEditCard,
  InstagramEditCard,
  LinkedInEditCard,
  PhoneEditCard,
  WhatsAppEditCard,
} from "@/components/players/contact-edit-card";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@laxdb/ui/components/ui/empty";

type ContactInfoCardWrapperProps = {
  children: React.ReactNode;
};

function ContactInfoCardWrapper({ children }: ContactInfoCardWrapperProps) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(min(18rem, 100%), 1fr))",
      }}
    >
      {children}
    </div>
  );
}

type EmptyContactInfoProps = {
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};

function EmptyContactInfo({ setIsEditing }: EmptyContactInfoProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserPen />
        </EmptyMedia>
        <EmptyTitle>No ContactInfo Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t added any contact information yet. Get started by
          adding user contact info.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          className="text-muted-foreground"
          onClick={() => {
            setIsEditing(true);
          }}
          size="sm"
          variant="link"
        >
          Learn More <ArrowUpRightIcon />
        </Button>
      </EmptyContent>
    </Empty>
  );
}

type ContactInfoViewProps = {
  contactInfo: PlayerWithContactInfoNonNullable;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};

function ContactInfoView({ contactInfo, setIsEditing }: ContactInfoViewProps) {
  if (!contactInfo) {
    return <EmptyContactInfo setIsEditing={setIsEditing} />;
  }

  return (
    <ContactInfoCardWrapper>
      {contactInfo.email && <EmailContactCard email={contactInfo.email} />}
      {contactInfo.phone && <PhoneContactCard phone={contactInfo.phone} />}
      {contactInfo.facebook && (
        <FacebookContactCard username={contactInfo.facebook} />
      )}
      {contactInfo.instagram && (
        <InstagramContactCard username={contactInfo.instagram} />
      )}
      {contactInfo.whatsapp && (
        <WhatsAppContactCard phone={contactInfo.whatsapp} />
      )}
      {contactInfo.linkedin && (
        <LinkedInContactCard username={contactInfo.linkedin} />
      )}
      {contactInfo.groupme && (
        <GroupMeContactCard username={contactInfo.groupme} />
      )}
      {contactInfo.emergencyContactName &&
        contactInfo.emergencyContactPhone && (
          <>
            <EmergencyContactNameCard name={contactInfo.emergencyContactName} />

            <EmergencyContactPhoneCard
              phone={contactInfo.emergencyContactPhone}
            />
          </>
        )}
    </ContactInfoCardWrapper>
  );
}

type ContactInfoEditProps = {
  contactInfo: PlayerWithContactInfoNonNullable;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};

function ContactInfoEdit({ contactInfo, setIsEditing }: ContactInfoEditProps) {
  const form = useForm<PlayerWithContactInfoNonNullable>({
    defaultValues: contactInfo,
  });

  const onSubmit = (_data: PlayerWithContactInfoNonNullable) => {
    setIsEditing(false);
  };

  const handleReset = () => {
    form.reset(contactInfo);
  };

  const handleCancel = () => {
    form.reset(contactInfo);
    setIsEditing(false);
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <ContactInfoCardWrapper>
        <EmailEditCard form={form} />
        <PhoneEditCard form={form} />
        <FacebookEditCard form={form} />
        <InstagramEditCard form={form} />
        <WhatsAppEditCard form={form} />
        <LinkedInEditCard form={form} />
        <GroupMeEditCard form={form} />
        <EmergencyContactNameEditCard form={form} />
        <EmergencyContactPhoneEditCard form={form} />
      </ContactInfoCardWrapper>
      <div className="flex gap-2">
        <Button type="submit">Save Changes</Button>
        <Button onClick={handleReset} type="button" variant="outline">
          Reset
        </Button>
        <Button onClick={handleCancel} type="button" variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export {
  ContactInfoCardWrapper,
  ContactInfoEdit,
  ContactInfoView,
  EmptyContactInfo,
};
