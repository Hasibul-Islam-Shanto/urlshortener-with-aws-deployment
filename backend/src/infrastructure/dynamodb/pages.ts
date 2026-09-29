export type DynamoPage = {
  Items?: readonly unknown[] | undefined;
  LastEvaluatedKey?: Record<string, unknown> | undefined;
};

type PageKey = Record<string, unknown>;

export const collectAllPages = async (
  loadPage: (startKey?: PageKey) => Promise<DynamoPage>,
  startKey?: PageKey,
): Promise<readonly unknown[]> => {
  const { Items = [], LastEvaluatedKey } = await loadPage(startKey);
  if (LastEvaluatedKey === undefined) {
    return Items;
  }
  return [...Items, ...(await collectAllPages(loadPage, LastEvaluatedKey))];
};
