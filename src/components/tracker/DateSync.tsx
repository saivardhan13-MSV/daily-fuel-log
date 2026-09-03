"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { todayStr } from "@/lib/nutrition";

// The server picks a default date using its own (UTC) clock when the URL has
// no ?date=. If the viewer's local date differs (anyone east of UTC, notably
// right after their local midnight), silently correct the URL to their real
// local "today" so entries land on the right day.
export default function DateSync({
  currentDate,
  hasExplicitDate,
}: {
  currentDate: string;
  hasExplicitDate: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (hasExplicitDate) return;
    const localToday = todayStr();
    if (localToday !== currentDate) {
      router.replace(`/?date=${localToday}`);
    }
  }, [hasExplicitDate, currentDate, router]);

  return null;
}
