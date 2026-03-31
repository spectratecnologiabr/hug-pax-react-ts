import { RefObject, useEffect, useState } from "react";

function resolveRowCount(width: number) {
    if (width >= 1500) return 2;
    if (width >= 900) return 3;
    return 4;
}

export function useResponsiveGridPageSize(gridRef: RefObject<HTMLElement | null>, fallbackPageSize = 12) {
    const [pageSize, setPageSize] = useState(fallbackPageSize);

    useEffect(() => {
        if (typeof window === "undefined") return;

        function updatePageSize() {
            const gridElement = gridRef.current;

            if (!gridElement) return;

            const computedStyles = window.getComputedStyle(gridElement);
            const gridTracks = computedStyles.gridTemplateColumns
                .split(" ")
                .map((track) => track.trim())
                .filter(Boolean);

            const columns = Math.max(1, gridTracks.length);
            const rows = resolveRowCount(gridElement.clientWidth || window.innerWidth);
            const nextPageSize = Math.max(columns, columns * rows);

            setPageSize((currentPageSize) => currentPageSize === nextPageSize ? currentPageSize : nextPageSize);
        }

        updatePageSize();

        const gridElement = gridRef.current;

        if (!gridElement) return;

        const resizeObserver = new ResizeObserver(() => {
            updatePageSize();
        });

        resizeObserver.observe(gridElement);
        window.addEventListener("resize", updatePageSize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updatePageSize);
        };
    }, [fallbackPageSize, gridRef]);

    return pageSize;
}
