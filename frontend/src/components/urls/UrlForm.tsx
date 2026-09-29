import { Link2 } from "lucide-react";
import { useState, type SubmitEvent } from "react";

import { validateUrl } from "../../features/urls/validation";
import type { CreateUrlResponse } from "../../types/url";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { SectionHeading } from "../ui/SectionHeading";
import { CopyButton } from "./CopyButton";

const CREATE_ERROR =
  "We couldn't create the short URL. Please check the URL and try again.";

const CreatedShortUrl = ({
  shortUrl,
  onCopied,
}: {
  shortUrl: string;
  onCopied?: () => void;
}) => (
  <div className="mt-space-6 grid gap-space-3 border-t border-border-card pt-space-6">
    <p className="text-xl text-text-on-card-muted">Your shortened URL</p>
    <p className="truncate font-medium text-2xl text-text-on-card" title={shortUrl}>
      {shortUrl}
    </p>
    <CopyButton
      value={shortUrl}
      label={`Copy shortened URL ${shortUrl}`}
      onCopied={onCopied}
    />
  </div>
);

type UrlFormProps = {
  onCreate: (url: string) => Promise<CreateUrlResponse>;
  onCreated?: () => void;
  onCopied?: () => void;
  shortUrlFor: (shortCode: string) => string;
};

export const UrlForm = ({ onCreate, onCreated, onCopied, shortUrlFor }: UrlFormProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreateUrlResponse | undefined>(undefined);

  const submit = async () => {
    const validationError = validateUrl(value);
    if (validationError !== null) {
      setError(validationError);
      setCreated(undefined);
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      const result = await onCreate(value.trim());
      setValue("");
      setCreated(result);
      onCreated?.();
    } catch {
      setCreated(undefined);
      setError(CREATE_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    void submit();
  };

  const shortUrl = created === undefined ? undefined : shortUrlFor(created.shortCode);

  return (
    <Card>
      <form className="grid gap-space-5" onSubmit={onSubmit} noValidate>
        <SectionHeading
          as="h3"
          title="Shorten a URL"
          icon={<Link2 aria-hidden="true" className="size-5" strokeWidth={2.25} />}
        />
        <Input
          id="long-url"
          name="url"
          label="Your long URL"
          placeholder="Paste your long URL"
          type="url"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          value={value}
          disabled={submitting}
          error={error}
          onChange={(event) => {
            setValue(event.target.value);
            if (error !== undefined) {
              setError(undefined);
            }
          }}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            {submitting ? "Creating..." : "Shorten URL"}
          </Button>
        </div>
      </form>
      {shortUrl !== undefined ? (
        <CreatedShortUrl shortUrl={shortUrl} onCopied={onCopied} />
      ) : null}
    </Card>
  );
};
