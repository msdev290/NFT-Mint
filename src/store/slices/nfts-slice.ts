import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setAll } from "src/helpers";

const initialState: Array<any> = [];

const nftsSlice = createSlice({
    name: "AdventureNfts",
    initialState,
    reducers: {
        fetchNft(state, action: PayloadAction<any>) {
            state.push(action.payload);
        },
        clearNfts(state) {
            state.splice(0, state.length);
        },
        fetchNftDetails(state, action: PayloadAction<any>) {
            const target = state.find(x => x === action.payload);
            if (target) {
                setAll(target, action.payload);
            }
        },
    },
});

export const { fetchNft, clearNfts, fetchNftDetails } = nftsSlice.actions;

export default nftsSlice.reducer;
