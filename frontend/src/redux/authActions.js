import api from "@/constants/constant";
import { PURGE } from "redux-persist";
import { logoutUser } from "./authSlice";

export const logout = () => async (dispatch) => {
    try {
        // Call the backend logout endpoint
        await api.post("/user/logout");
        
        // Clear localStorage items
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
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
        // Even if the API call fails, we should still clear local data and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch(logoutUser());
        dispatch({ 
            type: PURGE,
            result: () => null
        });
        window.location.href = "/login";
    }
}; 