import { DashboardHeader } from '@/components/sidebar/dashboard-header';
import { SettingsSubNav } from './settings-sub-nav';

type SettingsHeaderProps = {
  organizationSlug: string;
  children: React.ReactNode;
};

export function SettingsHeader({
  organizationSlug,
  children,
}: SettingsHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <SettingsSubNav organizationSlug={organizationSlug} />
    </div>
  );
}
