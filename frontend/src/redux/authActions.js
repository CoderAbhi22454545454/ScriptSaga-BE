import api from "@/constants/constant";
import { PURGE } from "redux-persist";
import { logoutUser } from "./authSlice";

export const logout = () => async (dispatch) => {
    try {
        // Call the backend logout endpoint
        await api.post("/user/logout");
        
        // Clear Redux state
        dispatch(logoutUser());
        
        // Clear Redux persist storage
        dispatch({ 
            type: PURGE,
            result: () => null
        });
        
        // Redirect to login page
        window.location.href = "/login";
    } catch (error) {
        console.error("Logout error:", error);
        // Even if the API call fails, we should still clear state and redirect
        dispatch(logoutUser());
        dispatch({ 
            type: PURGE,
            result: () => null
        });
        window.location.href = "/login";
    }
}; 