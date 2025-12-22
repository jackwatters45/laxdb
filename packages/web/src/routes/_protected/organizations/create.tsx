import { createFileRoute } from '@tanstack/react-router';
import { CreateOrganizationForm } from '@/components/organizations/create-form';

export const Route = createFileRoute('/_protected/organizations/create')({
  component: CreateOrganizationPage,
});

function CreateOrganizationPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <CreateOrganizationForm />
    </div>
  );
}
