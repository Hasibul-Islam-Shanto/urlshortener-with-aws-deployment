import { useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { copyText } from "../../features/urls/format";

type CopyButtonProps = {
  value: string;
  label: string;
  onCopied?: () => void;
  resetAfterMs?: number;
};

export const CopyButton = ({
  value,
  label,
  onCopied,
  resetAfterMs = 2000,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCopied(false);
    }, resetAfterMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copied, resetAfterMs]);

  return (
    <div className="grid gap-space-2">
      <Button
        variant="secondary"
        aria-label={label}
        onClick={() => {
          void copyText(value).then((didCopy) => {
            if (!didCopy) {
              setCopied(false);
              setFailed(true);
              return;
            }
            setFailed(false);
            setCopied(true);
            onCopied?.();
          });
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
      {failed ? (
        <p className="text-xl text-danger" role="alert">
          Unable to copy automatically. Please copy the URL manually.
        </p>
      ) : null}
    </div>
  );
};
