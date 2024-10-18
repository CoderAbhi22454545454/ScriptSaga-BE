import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  File,
  Home,
  LineChart,
  ListFilter,
  MoreVertical,
  Package,
  Package2,
  PanelLeft,
  Search,
  Settings,
  ShoppingCart,
  LogOut,
  Users2,
  GraduationCap,
  School,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { logout } from "@/redux/authSlice";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect, useRef } from "react";
import api from "@/constants/constant";
import _ from "lodash";
import { useNavigate } from "react-router-dom";

export function Navbar({ children }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNoUsersMessage, setShowNoUsersMessage] = useState(false);
  const previousSearchTerm = useRef("");
  const previousSearchResults = useRef([]);

  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const fetchSearchResult = async (searchTerm) => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) return { users: [] };

    const { data } = await api.get("/user/search", {
      params: { query: trimmedSearchTerm },
    });
    return data;
  };

  const {
    data: searchResults,
    refetch,
    isFetching,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: ["searchResults", searchTerm],
    queryFn: () => fetchSearchResult(searchTerm),
    enabled: !!searchTerm,
    refetchOnWindowFocus: false,
    cacheTime: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const debouncedFetch = useCallback(
    _.debounce(() => {
      const trimmedSearchTerm = searchTerm.trim();
      if (
        trimmedSearchTerm.length >= 2 &&
        !(
          previousSearchTerm.current &&
          trimmedSearchTerm.startsWith(previousSearchTerm.current) &&
          previousSearchResults.current.length > 0
        )
      ) {
        refetch();
      }
    }, 1400),
    [searchTerm, refetch]
  );

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      debouncedFetch();
    }
  }, [searchTerm, debouncedFetch]);

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timer = setTimeout(() => {
        if (
          searchResults &&
          searchResults.users &&
          searchResults.users.length === 0
        ) {
          setShowNoUsersMessage(true);
        } else {
          setShowNoUsersMessage(false);
        }
      }, 100);

      previousSearchTerm.current = searchTerm.trim();
      previousSearchResults.current = searchResults?.users || [];

      return () => clearTimeout(timer);
    }
  }, [searchResults, searchTerm]);

  const handleSearchValue = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowNoUsersMessage(false);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handelStudentClick = (studentId) => {
    navigate(`/admin/student/${studentId}`);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
         <aside className="fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex w-52">
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/" className="flex items-center space-x-2">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
          <span className="font-bold text-lg">ScripSaga</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="p-4 space-y-2">
            <li>
              <Link
                to="/admin"
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </li>
       
          </ul>
        </nav>
        <div className="border-t p-4">
          <Link
            to="/settings"
            className="flex items-center space-x-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
      <div className="flex flex-col sm:gap-4  sm:pl-14 z-0 ">
        <header className="sticky bg-white top-0 z-30 flex h-14 items-center gap-4 border-b px-4 py-4 sm:static sm:h-auto sm:border-0 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  to="/"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center gap-4 px-2.5 text-foreground"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Orders
                </Link>
                <Link
                  to="/products"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Package className="h-5 w-5" />
                  Products
                </Link>
                <Link
                  to="/customers"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Users2 className="h-5 w-5" />
                  Customers
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <LineChart className="h-5 w-5" />
                  Analytics
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground bg-gray" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchValue}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
          </div>

          {searchTerm.trim().length > 0 && (
 
          <div className="absolute top-14 right-32 w-96 bg-white border border-gray-200 mt-1 rounded-lg  max-h-60 overflow-y-auto z-50">
            {isFetching &&
              (!searchResults || searchResults.users.length === 0) && (
                <p>Loading...</p>
              )}

            {isSuccess && searchResults && searchResults.users.length > 0 && (
              <>
                {searchResults.users.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handelStudentClick(user._id)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <p>
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                ))}
              </>
            )}

            {isSuccess && searchResults && (
              <p
                className={`p-2 ${
                  searchResults.users.length === 0 &&
                  searchTerm.trim().length >= 1
                    ? "block"
                    : "hidden"
                }`}
              >
                No users found
              </p>
            )}

            {isError && (
              <div className="absolute top-14 right-0 w-96 bg-white border border-gray-200 mt-1 rounded-lg shadow-lg z-50 p-4 text-center">
                <p>Something went wrong. Please try again.</p>
              </div>
            )}
          </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar>
                  <AvatarImage
                    src={user?.avatar || "https://github.com/shadcn.png"}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            {/* <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.name || "User Name"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent> */}
          </DropdownMenu>
          <button onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </header>
        <main className="p-4 pl-28 bg-transparent">{children}</main>
      </div>
    </div>
  );
}
