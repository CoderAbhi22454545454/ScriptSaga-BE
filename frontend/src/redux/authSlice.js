// authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import api from "@/constants/constant";
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

export const logout = () => async (dispatch) => {
    try {
        await api.post("/user/logout");
        
        // Clear localStorage items
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch the logout action to update Redux state
        dispatch(logoutUser());
        
        // Redirect to login page
        window.location.href = "/login";
    } catch (error) {
        console.error("Logout error:", error);
    }
};