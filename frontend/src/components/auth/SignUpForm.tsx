import { UserPlus } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";

import { signUpRequestError } from "../../features/auth/form-errors";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from "../../features/auth/validation";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { SectionHeading } from "../ui/SectionHeading";

type SignUpFormProps = {
  onSubmit: (email: string, password: string) => Promise<void>;
};

export const SignUpForm = ({ onSubmit }: SignUpFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    const nextConfirmError = validateConfirmPassword(password, confirmPassword);
    setEmailError(nextEmailError ?? undefined);
    setPasswordError(nextPasswordError ?? undefined);
    setConfirmError(nextConfirmError ?? undefined);
    if (
      nextEmailError !== null ||
      nextPasswordError !== null ||
      nextConfirmError !== null
    ) {
      return;
    }
    setFormError(undefined);
    setSubmitting(true);
    try {
      await onSubmit(email.trim(), password);
    } catch (error) {
      const failure = signUpRequestError(error);
      setEmailError(failure.email);
      setPasswordError(failure.password);
      setFormError(failure.form);
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
          title="Create an account"
          icon={<UserPlus aria-hidden="true" className="size-5" strokeWidth={2.25} />}
        />
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
          autoComplete="new-password"
          value={password}
          disabled={submitting}
          error={passwordError}
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError(undefined);
          }}
        />
        <Input
          id="confirm-password"
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          disabled={submitting}
          error={confirmError}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setConfirmError(undefined);
          }}
        />
        {formError !== undefined ? (
          <p className="text-xl text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" loading={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </Button>
        <p className="text-xl text-text-on-card-muted">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
};
