package com.greenlink.glsupply.es;

import java.util.List;
import java.util.Map;

public record EsPageResult(
        long total,
        List<Long> orderedIds,
        Map<Long, String> highlightTitles,
        Map<Long, String> highlightSummaries
) {
    public static EsPageResult empty() {
        return new EsPageResult(0L, List.of(), Map.of(), Map.of());
    }
}
