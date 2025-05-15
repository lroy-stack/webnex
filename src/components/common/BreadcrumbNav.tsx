import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

export const BreadcrumbNav = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const routeNamesMap: Record<string, string> = {
    packs: "Packs",
    servicios: "Servicios",
    contacto: "Contacto",
    app: "Panel de Cliente",
    "auth-myweb": "Admin",
  };

  // Filter out the "project" path segment from the breadcrumb display
  // but keep the project ID if the path starts with "project"
  const displayPathnames = pathnames.filter((name, index) => {
    // If this is the "project" segment and there's a project ID after it, skip showing "project"
    if (name === "project" && index === 0 && pathnames.length > 1) {
      return false;
    }
    return true;
  });

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {displayPathnames.map((name, index) => {
          // For project IDs that come after "project", we need to make the route include "project" even though we don't show it
          const isProjectId = pathnames[0] === "project" && index === 0 && displayPathnames.length >= 1;
          
          // Calculate the proper route
          let routeTo;
          if (isProjectId) {
            // For project IDs, use the full path including the hidden "project" segment
            routeTo = `/${pathnames.slice(0, index + 2).join("/")}`;
          } else {
            routeTo = `/${pathnames.slice(0, pathnames.indexOf(name) + 1).join("/")}`;
          }
          
          const isLast = index === displayPathnames.length - 1;
          
          // Use project ID as display name or look up in routeNamesMap
          let displayName;
          if (isProjectId) {
            displayName = "Proyecto";
          } else {
            displayName = routeNamesMap[name] || name;
          }

          return (
            <React.Fragment key={routeTo}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={routeTo}>{displayName}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
