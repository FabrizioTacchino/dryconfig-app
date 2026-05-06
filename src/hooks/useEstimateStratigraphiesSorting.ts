
import { useState, useCallback } from "react";
import { EstimateStratigraphy } from "@/types/estimateStratigraphy";

// Campi ordinabili
export type EstimateStratigraphySortField =
  | "name"
  | "area"
  | "unitCost"
  | "totalCost"
  | "pricesUpdatedAt";

export type SortDirection = "asc" | "desc";

export interface UseEstimateStratigraphiesSortingReturn {
  sortField: EstimateStratigraphySortField;
  sortDirection: SortDirection;
  setSort: (field: EstimateStratigraphySortField) => void;
  getSortedStratigraphies: (
    stratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[]
  ) => (EstimateStratigraphy & { stratigraphy?: any })[];
}

export function useEstimateStratigraphiesSorting(
  initialField: EstimateStratigraphySortField = "name",
  initialDirection: SortDirection = "asc"
): UseEstimateStratigraphiesSortingReturn {
  const [sortField, setSortField] = useState<EstimateStratigraphySortField>(initialField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const setSort = useCallback((field: EstimateStratigraphySortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDirection("asc");
      return field;
    });
  }, []);

  const getSortedStratigraphies = useCallback(
    (
      stratigraphies: (EstimateStratigraphy & { stratigraphy?: any })[]
    ) => {
      const sorted = [...stratigraphies].sort((a, b) => {
        let av: any, bv: any;
        switch (sortField) {
          case "name":
            av = a.name?.toLowerCase() ?? "";
            bv = b.name?.toLowerCase() ?? "";
            break;
          case "area":
            av = a.area ?? 0;
            bv = b.area ?? 0;
            break;
          case "unitCost":
            av = a.unitCost ?? 0;
            bv = b.unitCost ?? 0;
            break;
          case "totalCost":
            av = a.totalCost ?? 0;
            bv = b.totalCost ?? 0;
            break;
          case "pricesUpdatedAt":
            av = a.pricesUpdatedAt ? new Date(a.pricesUpdatedAt).getTime() : 0;
            bv = b.pricesUpdatedAt ? new Date(b.pricesUpdatedAt).getTime() : 0;
            break;
          default:
            av = a[sortField];
            bv = b[sortField];
        }
        if (typeof av === "number" && typeof bv === "number") {
          return av - bv;
        }
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      });

      if (sortDirection === "desc") sorted.reverse();
      return sorted;
    },
    [sortField, sortDirection]
  );

  return {
    sortField,
    sortDirection,
    setSort,
    getSortedStratigraphies,
  };
}
