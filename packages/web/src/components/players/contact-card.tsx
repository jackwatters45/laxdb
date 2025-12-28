import { Copy, ExternalLink, Mail, MessageCircle, Phone } from "lucide-react";
import { createContext, useContext } from "react";
import { toast } from "sonner";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@laxdb/ui/components/ui/tooltip";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@laxdb/ui/components/ui/item";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
} from "@laxdb/ui/components/social-icons";

type ContactCardContextType = {
  label: string;
  value: string;
  href?: string | undefined;
};

const ContactCardContext = createContext<ContactCardContextType | null>(null);

function useContactCard() {
  const context = useContext(ContactCardContext);
  if (!context) {
    throw new Error("ContactCard components must be used within ContactCard");
  }
  return context;
}

type ContactCardProps = {
  children: React.ReactNode;
  className?: string;
  label: string;
  value: string;
  href?: string;
};

function ContactCard({
  children,
  className,
  label,
  value,
  href,
}: ContactCardProps) {
  return (
    <ContactCardContext.Provider value={{ label, value, href }}>
      <Item
        className={`w-full items-center justify-between gap-2 p-2 shadow-sm transition-shadow hover:shadow-md ${className ?? ""}`}
        variant={"outline"}
      >
        {children}
      </Item>
    </ContactCardContext.Provider>
  );
}

type ContactCardContentProps = {
  children: React.ReactNode;
};

function ContactCardContent({ children }: ContactCardContentProps) {
  return (
    <ItemContent className="flex-row items-center gap-2">
      {children}
    </ItemContent>
  );
}

type ContactCardIconProps = {
  children: React.ReactNode;
};

function ContactCardIcon({ children }: ContactCardIconProps) {
  return <ItemMedia variant="icon">{children}</ItemMedia>;
}

function ContactCardData() {
  return (
    <ItemGroup>
      <ContactCardLabel />
      <ContactCardValue />
    </ItemGroup>
  );
}

function ContactCardLabel() {
  const { label } = useContactCard();
  return (
    <ItemTitle className="text-muted-foreground text-xs">{label}</ItemTitle>
  );
}

function ContactCardValue() {
  const { href, value } = useContactCard();
  if (!href) {
    return <span className="break-all font-medium text-sm">{value}</span>;
  }

  const isExternal = href.startsWith("http");
  return (
    <a
      className="break-all font-medium text-blue-600 text-sm hover:underline"
      href={href}
      {...(isExternal && { rel: "noreferrer", target: "_blank" })}
    >
      {value}
    </a>
  );
}

function ContactCardActions() {
  const { value, label, href } = useContactCard();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <TooltipProvider>
      <ItemActions className="gap-0.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                className="h-6 w-6 p-0"
                onClick={handleCopy}
                size="sm"
                variant="ghost"
              />
            }
          >
            <Copy className="h-3 w-3" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy value</p>
          </TooltipContent>
        </Tooltip>
        {href && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  render={
                    <a
                      href={href}
                      {...(href.startsWith("http") && {
                        rel: "noreferrer",
                        target: "_blank",
                      })}
                    />
                  }
                  className="h-6 w-6 p-0"
                  size="sm"
                  variant="ghost"
                />
              }
            >
              <ExternalLink className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Open link</p>
            </TooltipContent>
          </Tooltip>
        )}
      </ItemActions>
    </TooltipProvider>
  );
}

type EmailContactCardProps = {
  email: string;
};

function EmailContactCard({ email }: EmailContactCardProps) {
  return (
    <ContactCard href={`mailto:${email}`} label="Email" value={email}>
      <ContactCardContent>
        <ContactCardIcon>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type PhoneContactCardProps = {
  phone: string;
};

function PhoneContactCard({ phone }: PhoneContactCardProps) {
  return (
    <ContactCard href={`tel:${phone}`} label="Phone" value={phone}>
      <ContactCardContent>
        <ContactCardIcon>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type FacebookContactCardProps = {
  username: string;
};

function FacebookContactCard({ username }: FacebookContactCardProps) {
  return (
    <ContactCard
      href={`https://facebook.com/${username}`}
      label="Facebook"
      value={username}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <FacebookIcon className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type InstagramContactCardProps = {
  username: string;
};

function InstagramContactCard({ username }: InstagramContactCardProps) {
  return (
    <ContactCard
      href={`https://instagram.com/${username}`}
      label="Instagram"
      value={`@${username}`}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <InstagramIcon className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type WhatsAppContactCardProps = {
  phone: string;
};

function WhatsAppContactCard({ phone }: WhatsAppContactCardProps) {
  return (
    <ContactCard href={`https://wa.me/${phone}`} label="WhatsApp" value={phone}>
      <ContactCardContent>
        <ContactCardIcon>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type GroupMeContactCardProps = {
  username: string;
};

function GroupMeContactCard({ username }: GroupMeContactCardProps) {
  return (
    <ContactCard
      href={`https://groupme.com/contact/${username}`}
      label="GroupMe"
      value={username}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type LinkedInContactCardProps = {
  username: string;
};

function LinkedInContactCard({ username }: LinkedInContactCardProps) {
  return (
    <ContactCard
      href={`https://linkedin.com/in/${username}`}
      label="LinkedIn"
      value={username}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <LinkedInIcon className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type EmergencyContactNameCardProps = {
  name: string;
};

function EmergencyContactNameCard({ name }: EmergencyContactNameCardProps) {
  return (
    <ContactCard label="Emergency Contact Name" value={name}>
      <ContactCardContent>
        <ContactCardIcon>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type EmergencyContactPhoneCardProps = {
  phone: string;
};

function EmergencyContactPhoneCard({ phone }: EmergencyContactPhoneCardProps) {
  return (
    <ContactCard
      href={`tel:${phone}`}
      label="Emergency Contact Phone"
      value={phone}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

export {
  ContactCard,
  ContactCardActions,
  ContactCardContent,
  ContactCardData,
  ContactCardIcon,
  ContactCardLabel,
  ContactCardValue,
  EmailContactCard,
  EmergencyContactNameCard,
  EmergencyContactPhoneCard,
  FacebookContactCard,
  GroupMeContactCard,
  InstagramContactCard,
  LinkedInContactCard,
  PhoneContactCard,
  WhatsAppContactCard,
};
