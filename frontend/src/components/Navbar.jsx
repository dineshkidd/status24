import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SignOutButton } from '@clerk/clerk-react';
import { LogOut, User } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

function Navbar({ className }) {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const user = useUserStore((state) => state.user);

    // Close the dropdown when clicking outside of it.
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const toggleDropdown = () => {
        setDropdownOpen(prev => !prev);
    };

    return (
        <nav className={`flex items-center p-4 border-b justify-between bg-background ${className}`}>
            {/* Logo placeholder */}
            <div className="text-xl font-bold cursor-pointer flex items-center gap-1" onClick={() => navigate('/')}>
                <img src="/Status24.svg" alt="Logo" className="h-6" />
                <span className="text-2xl font-bold font-mono">Status24</span>
            </div>

            {/* Mobile Menu: shadcn Dropdown Menu */}
            <div className="flex gap-2">
                <div className=" relative">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="min-w-[200px] w-auto max-w-[300px] bg-background border">
                            {user && (
                                <DropdownMenuItem className="flex items-center gap-2">
                                    <User className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm break-all">
                                        {user?.primaryEmailAddress?.emailAddress}
                                    </span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleNavigation('/')}>
                                Home
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleNavigation('/about')}>
                                About
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleNavigation('/contact')}>
                                Contact
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <SignOutButton>
                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </SignOutButton>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

            </div>

        </nav>
    );
}

export default Navbar; 