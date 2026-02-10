// app/providers.tsx
"use client";

import { Provider, useDispatch } from "react-redux";
import { store } from "@/lib/store/store";
import { useEffect } from "react";
import { initAuthAsync } from "@/lib/store/authSlice";
import { supabase } from "@/lib/supabaseClient";
import ReactQueryProvider from "./providers/ReactQueryProvider";

function AuthBootstrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initAuthAsync() as any);

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      dispatch(initAuthAsync() as any);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <Provider store={store}>
        <AuthBootstrapper>{children}</AuthBootstrapper>
      </Provider>
    </ReactQueryProvider>
  );
}
