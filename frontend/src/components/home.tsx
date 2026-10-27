"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { AppHeader } from "@/components/app-header";
import { EmployeeView } from "@/components/employee-view";
import { ItView } from "@/components/it-view";
import { PageSkeleton } from "@/components/states";
import { useUser } from "@/lib/user-context";

export function Home() {
  const { current } = useUser();
  return (
    // reducedMotion="user" disables Motion transforms when the OS asks for reduced motion.
    <MotionConfig reducedMotion="user">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {!current ? (
          <PageSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={current.username}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold">
                  {current.role === "it" ? "داشبورد پشتیبانی IT" : `سلام ${current.username}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {current.role === "it"
                    ? "همه تیکت‌ها، پیشنهاد هوش مصنوعی و ارسال پاسخ نهایی"
                    : "مشکل خود را ثبت کنید و وضعیت تیکت‌هایتان را پیگیری کنید."}
                </p>
              </div>
              {current.role === "it" ? <ItView username={current.username} /> : <EmployeeView username={current.username} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </MotionConfig>
  );
}
