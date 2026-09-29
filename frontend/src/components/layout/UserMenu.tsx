import { LogOut } from "lucide-react";

import { useAuth } from "../../features/auth/auth-context";
import { Dropdown } from "../ui/Dropdown";
import { UserAvatar } from "./UserAvatar";

export const UserMenu = () => {
  const { user, logout } = useAuth();

  if (user === null) {
    return null;
  }

  return (
    <Dropdown
      label={`Account menu for ${user.email}`}
      summary={
        <p className="truncate text-xl font-medium text-text-tertiary" title={user.email}>
          {user.email}
        </p>
      }
      items={[
        {
          id: "logout",
          label: "Logout",
          icon: <LogOut aria-hidden="true" className="size-4 shrink-0" />,
          onSelect: logout,
        },
      ]}
    >
      <UserAvatar email={user.email} decorative />
    </Dropdown>
  );
};
