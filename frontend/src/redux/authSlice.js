// authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { PURGE } from "redux-persist";

const authSlice = createSlice({
    name: "auth",
    initialState: {
        loading: false,
        user: null,
    },
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        logoutUser: (state) => {
            state.user = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(PURGE, (state) => {
            // This will be called when the persistor is purged
            return {
                loading: false,
                user: null,
            };
        });
    },
});

export const { setLoading, setUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;