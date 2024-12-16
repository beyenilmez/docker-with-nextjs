"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { push } = useRouter();

  return (
    <Card className="container bg-card py-3 px-4 border-0 flex items-center justify-between gap-6 rounded-2xl mt-5">
      <Skeleton className="text-primary cursor-pointer h-8 w-8" />

      <ul className="hidden md:flex items-center gap-10 text-card-foreground">
        <li>
          <Link href="/" className="text-sm font-medium transition-colors hover:text-accent">
            Ana Sayfa
          </Link>
        </li>
        <li>
          <Link href="/api-docs" className="text-sm font-medium transition-colors hover:text-accent">
            API
          </Link>
        </li>
      </ul>

      <div className="flex items-center">
        <div className="flex md:hidden mr-2 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5 rotate-0 scale-100" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  push("/");
                }}
              >
                <Link href="/">Ana Sayfa</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  push("/api-docs");
                }}
              >
                <Link href="/api-docs">API</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ModeToggle />
      </div>
    </Card>
  );
};

export default Navbar;
