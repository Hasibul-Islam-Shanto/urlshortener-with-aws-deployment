import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { SignInForm } from "../components/auth/SignInForm";
import { PageFrame } from "../components/layout/PageFrame";
import { useAuth } from "../features/auth/auth-context";
import { takeSessionNotice } from "../features/auth/authStorage";

const noticeFromState = (state: unknown): string | undefined => {
  if (typeof state !== "object" || state === null) {
    return undefined;
  }
  if ("accountCreated" in state && state.accountCreated === true) {
    return "Account created. Sign in to continue.";
  }
  return undefined;
};

export const SignInPage = () => {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notice] = useState(
    () => noticeFromState(location.state) ?? takeSessionNotice() ?? undefined,
  );

  return (
    <PageFrame centerMain>
      <div className="mx-auto grid w-full max-w-md gap-space-6">
        <SignInForm
          notice={notice}
          onSubmit={async (email, password) => {
            await signin(email, password);
            void navigate("/dashboard", { replace: true });
          }}
        />
      </div>
    </PageFrame>
  );
};
