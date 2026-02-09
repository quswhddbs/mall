// lib/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import cartReducer from "./cartSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer, // ✅ 장바구니 reducer 연결
  },
});

// ✅ RootState / AppDispatch 타입
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
