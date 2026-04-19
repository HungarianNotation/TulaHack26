"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import PageLoader from "./PageLoader";

const publicPaths = ["/", "/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || (!user && !publicPaths.includes(pathname))) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
