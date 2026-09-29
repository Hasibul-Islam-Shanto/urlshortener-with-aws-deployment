import { Badge } from "../ui/Badge";

type UrlStatsProps = {
  count: number;
};

export const UrlStats = ({ count }: UrlStatsProps) => (
  <Badge>{count === 1 ? "1 shortened URL" : `${count} shortened URLs`}</Badge>
);
