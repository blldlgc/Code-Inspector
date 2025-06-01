"use client"

import {
  BookOpen,
  ChevronsUpDown,
  Frame,
  LifeBuoy,
  LogOut,
  Map,
  PieChart,
  Send,
  Sparkles,
  Copy,
  BarChart2,
  GitFork,
  Shield,
  AlertTriangle,
  ExternalLink,
  Radar,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ReactNode } from 'react';

import { signOut } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from "@/config/firebase.ts";
import { ModeToggle } from "./mode-toggle"
import { AIChatBox } from "@/components/AIChatBox";
import logo from "/logo.png"

const GITHUB_REPO = "https://github.com/blldlgc/code-inspector";
const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;
const GITHUB_DISCUSSIONS = `${GITHUB_REPO}/discussions`;

const handleLogout = async () => {
  try {
      await signOut(auth); // Firebase'den çıkış işlemi
  } catch (error) {
      console.error('Logout failed: ', error);
  }
};

export default function SidebarLayout({ children }: { children: ReactNode }) {

  const navigate = useNavigate();
  const location = useLocation();
  console.log(auth.currentUser?.email);

  // Path ve başlıkları eşleştirip Breadcrumb'a ekleme
  const pathTitleMap: { [key: string]: string } = {
    "/clonedetector": "Clone Detector",
    "/codegraph": "Code Graph Tool",
    "/codeanalyzer": "Code Analyzer",
    "/metrics": "Code Metrics",
    "/coverage": "Code Coverage",
    "/testgenerator": "Auto Test Generator",
    "/codesecurity": "Quality & Error Prediction",
    "/codesmell": "Code Smell Detector",
    "/codegraphcomparison": "Code Graph Comparison",
    "/": "Home", 
  };
  const currentPath = location.pathname;
  const currentTitle = pathTitleMap[currentPath] || "Unknown Page";

  const data = {
    user: {
      name: auth.currentUser?.displayName ?? "User",
      email: auth.currentUser?.email ?? "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    // Ana menü grupları
    menuGroups: [
      {
        title: "Code Analysis Tools",
        items: [
          {
            title: "Clone Detector",
            url: "/clonedetector",
            icon: Copy,
            description: "Identify duplicate code fragments",
          },
          {
            title: "Code Metrics",
            url: "/metrics",
            icon: BarChart2,
            description: "Analyze code complexity and quality metrics",
          },
          {
            title: "Code Smell",
            url: "/codesmell",
            icon: AlertTriangle,
            description: "Detect potential design flaws",
          },
        ],
      },
      {
        title: "Visualization Tools",
        items: [
          {
            title: "Code Graph Tool",
            url: "/codegraph",
            icon: GitFork,
            description: "Visualize code structure and dependencies",
          },
          {
            title: "Code Graph Comparison",
            url: "/codegraphcomparison",
            icon: GitFork,
            description: "Compare and analyze two different code graphs",
          },
        ],
      },
      {
        title: "Testing and Validation",
        items: [
          {
            title: "Code Coverage",
            url: "/coverage",
            icon: Shield,
            description: "Measure test coverage",
          },
          {
            title: "Auto Test Generator",
            url: "/testgenerator",
            icon: Sparkles,
            description: "Generate automated tests",
          },
        ],
      },
      {
        title: "Code Quality Assurance",
        items: [
          {
            title: "Quality & Error Prediction",
            url: "/codesecurity",
            icon: Radar,
            description: "Evaluate code quality and predict errors",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Support",
        url: GITHUB_DISCUSSIONS,
        icon: LifeBuoy,
        description: "Get help from the community",
        external: true
      },
      {
        title: "Feedback",
        url: GITHUB_ISSUES,
        icon: Send,
        description: "Report issues or suggest features",
        external: true
      },
      {
        title: "Documentation",
        url: `${GITHUB_REPO}#readme`,
        icon: BookOpen,
        description: "Read the documentation",
        external: true
      }
    ],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
  }
  
  // Helper function for external links
  const handleNavigation = (url: string, external: boolean) => {
    if (external) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(url);
    }
  };

  return (
    <div className="w-screen h-screen overflow-x-hidden">
      <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <button onClick={() => navigate('/')}
                  className="flex items-center focus:outline-none">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary 
                  text-sidebar-primary-foreground">
                    <img src={logo} alt="Code Inspector Logo" className="h-6 w-6 invert dark:invert-0 rounded-md" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Code Inspector</span>
                  </div>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Gruplandırılmış menü öğeleri */}
          {data.menuGroups.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.description}
                    >
                      <button 
                        onClick={() => navigate(item.url)}
                        className="flex items-center focus:outline-none"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}

          {/* Secondary menu items */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navSecondary.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      size="sm"
                      tooltip={item.description}
                    >
                      <button 
                        onClick={() => handleNavigation(item.url, item.external)}
                        className="flex items-center justify-between w-full focus:outline-none"
                      >
                        <span className="flex items-center">
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </span>
                        {item.external && (
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={data.user.avatar}
                        alt={data.user.name}
                      />
                      <AvatarFallback className="rounded-lg">CI</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {data.user.name}
                      </span>
                      <span className="truncate text-xs">
                        {data.user.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={data.user.avatar}
                          alt={data.user.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          CI
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {data.user.name}
                        </span>
                        <span className="truncate text-xs">
                          {data.user.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink onClick={() => navigate("/")}>Code Inspector</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2 px-4">
              <ModeToggle />
            </div>
          </header>
          <div className="flex-1 overflow-x-auto">
  <div className="min-w-full p-4 pt-0">
    {children}
  </div>
</div>
        </SidebarInset>
        <AIChatBox />
      </SidebarProvider>
    </div>
  );
}

