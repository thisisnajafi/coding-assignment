"use client";

import { Headset } from "lucide-react";
import { NativeSelect } from "@/components/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS, label } from "@/lib/labels";
import { useUser } from "@/lib/user-context";

export function AppHeader() {
  const { users, current, setUsername, loadingUsers } = useUser();
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Headset className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">پشتیبانی هوشمند IT</h1>
            <p className="text-xs text-muted-foreground">سامانه ثبت و پیگیری تیکت</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">کاربر نمایشی:</span>
          {loadingUsers || !current ? (
            <Skeleton data-testid="user-switcher-skeleton" className="h-9 w-44 rounded-lg" />
          ) : (
          <NativeSelect
            aria-label="انتخاب کاربر"
            value={current?.username ?? ""}
            onChange={(e) => setUsername(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.username} value={u.username}>
                {u.username} ({label(ROLE_LABELS, u.role)})
              </option>
            ))}
          </NativeSelect>
          )}
        </label>
      </div>
    </header>
  );
}
