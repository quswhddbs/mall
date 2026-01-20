// lib/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice"; 

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// ✅ 타입 추론 (App Router + TS에서 표준 패턴)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
