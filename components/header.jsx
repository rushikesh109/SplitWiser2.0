"use client";

import { useStoreUser } from "@/hooks/use-store-user";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarLoader } from "react-spinners";
import { Button } from "./ui/button";
import { Github, LayoutDashboard } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const { isLoading } = useStoreUser();
  const path = usePathname();

  return (
    <header className="fixed top-0 w-full border-b z-50 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/95 dark:bg-zinc-900/80 dark:supports-[backdrop-filter]:bg-zinc-900/60 dark:border-zinc-700">
      <nav className="container mx-auto px-5 md:px-9 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/logo.png"
            alt="SplitWiser Logo"
            width={160}
            height={48}
            className="h-45 w-auto object-contain"
            priority
          />
        </Link>

        {/* Nav links */}
        {path === "/" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              How It Works
            </Link>
          </div>
        )}

        {/* Auth Buttons + Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <div className="flex items-center gap-2">
        
        <Button
  aria-label="View SplitWiser project on GitHub"
  className="
    flex items-center gap-2
    bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
    text-black dark:text-white
    border-none cursor-pointer
    h-8 px-2
    sm:h-10 sm:px-4 sm:bg-green-600 sm:hover:bg-green-700 sm:text-white
  "
  onClick={() =>
    window.open(
      "https://github.com/rushikesh109/SplitWiser2.0",
      "_blank",
      "noopener,noreferrer"
    )
  }
>
  <Github size={20} strokeWidth={2.25} />
  <span className="hidden sm:inline">GitHub</span>
</Button>


        </div>
          <Authenticated>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center gap-2 h-10 cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>

              <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </Link>
            <UserButton />
          </Authenticated>

          <Unauthenticated>
            <SignInButton>
              <Button variant="ghost" className="h-10 cursor-pointer">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="bg-green-600 hover:bg-green-700 border-none text-white h-10 cursor-pointer">
                Getting Started
              </Button>
            </SignUpButton>
          </Unauthenticated>

          <ThemeToggle />
        </div>
      </nav>

      {isLoading && <BarLoader width="100%" color="#36d7b7" />}
    </header>
  );
};

export default Header;
