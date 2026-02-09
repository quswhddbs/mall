// lib/store/cartSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, ChangeCartParam } from "@/lib/api/cartApi";
import { getCartItems, postChangeCart } from "@/lib/api/cartApi";

type CartState = CartItem[];

const initialState: CartState = [];

export const getCartItemsAsync = createAsyncThunk<CartItem[]>(
  "cart/getCartItems",
  async () => {
    return await getCartItems();
  }
);

export const postChangeCartAsync = createAsyncThunk<CartItem[], ChangeCartParam>(
  "cart/postChangeCart",
  async (param) => {
    return await postChangeCart(param);
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: () => [],
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCartItemsAsync.fulfilled, (_state, action: PayloadAction<CartItem[]>) => {
        return action.payload;
      })
      .addCase(postChangeCartAsync.fulfilled, (_state, action: PayloadAction<CartItem[]>) => {
        return action.payload;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
