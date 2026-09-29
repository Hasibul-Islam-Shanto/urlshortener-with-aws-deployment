import { useAuth } from "../../features/auth/auth-context";
import { BrandLogo } from "./BrandLogo";
import { UserMenu } from "./UserMenu";

export const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const brandTo = user !== null ? "/dashboard" : "/signin";

  return (
    <div className="sticky top-0 z-30 px-space-7 pb-space-5 pt-space-7">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-space-4 focus:left-space-4 focus:z-50 focus:rounded-xs focus:bg-primary focus:px-space-4 focus:py-space-3 focus:text-xl focus:text-on-primary"
      >
        Skip to main content
      </a>
      <header className="surface-nav mx-auto flex w-full max-w-5xl items-center justify-between gap-space-4 rounded-sm border border-border-muted px-space-5 py-space-5 lg:px-space-6 lg:py-space-2">
        <BrandLogo to={brandTo} />
        {isAuthenticated ? <UserMenu /> : null}
      </header>
    </div>
  );
};
