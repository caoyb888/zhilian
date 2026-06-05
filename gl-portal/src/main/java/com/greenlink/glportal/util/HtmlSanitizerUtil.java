package com.greenlink.glportal.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public final class HtmlSanitizerUtil {

    private static final Safelist SAFELIST = Safelist.relaxed()
            .addTags("h1", "h2", "h3", "h4", "h5", "h6", "s", "u")
            .addAttributes("a", "href", "title", "target", "rel")
            .addProtocols("a", "href", "http", "https", "mailto")
            .addProtocols("img", "src", "http", "https");

    private HtmlSanitizerUtil() {}

    public static String sanitize(String html) {
        if (html == null || html.isBlank()) return html;
        return Jsoup.clean(html, SAFELIST);
    }
}
