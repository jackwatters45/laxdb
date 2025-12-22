import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { roles } from '../-data';

export type ModalAddUserProps = {
  children: React.ReactNode;
};

export function ModalAddUser({ children }: ModalAddUserProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form>
          <DialogHeader>
            <DialogTitle>Invite people to your workspace</DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6">
              With free plan, you can add up to 10 users to each workspace.
            </DialogDescription>
            <div className="mt-4">
              <Label className="font-medium" htmlFor="email-new-user">
                Email
              </Label>
              <Input
                className="mt-2"
                id="email-new-user"
                name="email-new-user"
                placeholder="Insert email..."
              />
            </div>
            <div className="mt-4">
              <Label className="font-medium" htmlFor="role-new-user">
                Select role
              </Label>
              <Select>
                <SelectTrigger
                  className="mt-2"
                  id="role-new-user"
                  name="role-new-user"
                >
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent align="end">
                  {roles.map((role) => (
                    <SelectItem
                      disabled={role.value === 'admin'}
                      key={role.value}
                      value={role.value}
                    >
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button
                className="mt-2 w-full sm:mt-0 sm:w-fit"
                variant="secondary"
              >
                Go back
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button className="w-full sm:w-fit" type="submit">
                Add user
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
