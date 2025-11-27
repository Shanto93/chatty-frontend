import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  activeRoomId: string | null;
}

const initialState: UiState = {
  activeRoomId: null
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveRoomId(state, action: PayloadAction<string | null>) {
      state.activeRoomId = action.payload;
    }
  }
});

export const { setActiveRoomId } = uiSlice.actions;

export default uiSlice.reducer;
