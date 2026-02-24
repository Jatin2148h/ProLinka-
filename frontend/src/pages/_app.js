import "@/styles/globals.css";
import { Provider } from "react-redux";
import store from "@/config/redux/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/config/redux/reducer/authSlice";
import { Toaster } from "react-hot-toast";

function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { user, isTokenThere } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if we have stored user data in localStorage
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken && !isTokenThere) {
      try {
        const parsedUser = JSON.parse(storedUser);
        dispatch(setUser(parsedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        // Clear invalid data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      }
    }
  }, [dispatch, isTokenThere]);

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <Component {...pageProps} />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: 'white',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: 'white',
              },
            },
          }}
        />
      </AuthInitializer>
    </Provider>
  );
}
