import { useNavigate } from "react-router-dom";

import { SignUpForm } from "../components/auth/SignUpForm";
import { PageFrame } from "../components/layout/PageFrame";
import { useAuth } from "../features/auth/auth-context";

export const SignUpPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  return (
    <PageFrame centerMain>
      <div className="mx-auto grid w-full max-w-md gap-space-6">
        <SignUpForm
          onSubmit={async (email, password) => {
            await signup(email, password);
            void navigate("/signin", { replace: true, state: { accountCreated: true } });
          }}
        />
      </div>
    </PageFrame>
  );
};
