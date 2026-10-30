import Link from "next/link";
import { Num, T } from "./i18n";

export const PAGE_SIZE = 15;

export function pageParam(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export default function Pagination({
  basePath,
  params,
  page,
  total,
}: {
  basePath: string;
  params: Record<string, string>;
  page: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;

  const href = (target: number) => {
    const query = new URLSearchParams(params);
    if (target > 1) query.set("page", String(target));
    const text = query.toString();
    return text ? `${basePath}?${text}` : basePath;
  };
  const link =
    "rounded-md border border-[#d5dee6] px-3 py-1.5 text-sm hover:bg-[#f0f4f7]";

  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span className="text-[#7e92a6]">
        <T k="aPageOf" params={{ page, pages }} />
      </span>
      <span className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={link}>
            <T k="aPrev" />
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className={link}>
            <T k="aNext" />
          </Link>
        ) : null}
      </span>
      <span className="sr-only">
        <Num value={total} />
      </span>
    </nav>
  );
}
