package com.greenlink.glmember.util;

public final class MaskUtil {

    private MaskUtil() {}

    public static String maskPhone(String phone) {
        if (phone == null || phone.length() != 11) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String masked = local.length() <= 3 ? "***" : local.substring(0, 3) + "***";
        return masked + "@" + parts[1];
    }

    public static String maskName(String name) {
        if (name == null || name.isBlank()) return "***";
        return name.charAt(0) + "**";
    }

    public static String memberLevelName(Integer level) {
        if (level == null) return "普通会员";
        return switch (level) {
            case 2 -> "VIP会员";
            case 3 -> "理事会员";
            default -> "普通会员";
        };
    }
}
