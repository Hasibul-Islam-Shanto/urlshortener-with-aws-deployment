import { useCallback, useEffect, useRef, useState } from "react";

import type { UrlRecord } from "../../types/url";

export type UrlListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: readonly UrlRecord[] };

type UseUrlListArgs = {
  listUrls: () => Promise<readonly UrlRecord[]>;
};

export const useUrlList = ({ listUrls }: UseUrlListArgs) => {
  const [state, setState] = useState<UrlListState>({ status: "loading" });
  const listRef = useRef(listUrls);
  const activeRef = useRef(true);

  useEffect(() => {
    listRef.current = listUrls;
  }, [listUrls]);

  const load = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    if (mode === "refresh") {
      setState({ status: "loading" });
    }
    try {
      const items = await listRef.current();
      if (activeRef.current) {
        setState({ status: "ready", items });
      }
    } catch {
      if (activeRef.current) {
        setState({ status: "error" });
      }
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void load("initial");
    return () => {
      activeRef.current = false;
    };
  }, [load]);

  const retry = useCallback(() => {
    void load("refresh");
  }, [load]);

  const reload = useCallback(() => load("silent"), [load]);

  return { state, retry, reload };
};
