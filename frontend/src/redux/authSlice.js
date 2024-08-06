// authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import api from "@/constants/constant";
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
});

export const { setLoading, setUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;

export const logout = () => async (dispatch) => {
    try {
        await api.post("/user/logout");
        dispatch(logoutUser());
        window.location.href = "/login"; // Redirect to login
    } catch (error) {
        console.error("Logout error:", error);
    }
};