import { LogIn } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";

import { signInRequestError } from "../../features/auth/form-errors";
import { validateEmail, validatePassword } from "../../features/auth/validation";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { SectionHeading } from "../ui/SectionHeading";

type SignInFormProps = {
  onSubmit: (email: string, password: string) => Promise<void>;
  notice?: string;
};

export const SignInForm = ({ onSubmit, notice }: SignInFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setEmailError(nextEmailError ?? undefined);
    setPasswordError(nextPasswordError ?? undefined);
    if (nextEmailError !== null || nextPasswordError !== null) {
      return;
    }
    setFormError(undefined);
    setSubmitting(true);
    try {
      await onSubmit(email.trim(), password);
    } catch (error) {
      setFormError(signInRequestError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const onFormSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    void submit();
  };

  return (
    <Card>
      <form className="grid gap-space-5" onSubmit={onFormSubmit} noValidate>
        <SectionHeading
          title="Sign in"
          icon={<LogIn aria-hidden="true" className="size-5" strokeWidth={2.25} />}
        />
        {notice !== undefined ? (
          <p className="text-xl text-text-on-card-muted" role="status">
            {notice}
          </p>
        ) : null}
        <Input
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={submitting}
          error={emailError}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(undefined);
          }}
        />
        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          disabled={submitting}
          error={passwordError}
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError(undefined);
          }}
        />
        {formError !== undefined ? (
          <p className="text-xl text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" loading={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-xl text-text-on-card-muted">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </Card>
  );
};
