import { useRouter } from "next/router";
import NavbarComponent from "@/Components/Navbar";

function UserLayout({ children }) {
  const router = useRouter();

  // ✅ ADD: pages where navbar should NOT appear
  const noNavbarRoutes = ["/login", "/register"];

  // login / register page → no navbar
  if (noNavbarRoutes.includes(router.pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <NavbarComponent />
      {children}
    </>
  );
}

export default UserLayout;
