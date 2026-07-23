package com.icici.lifeclaim.rules.model;

import java.util.List;

public final class ExclusionRuleHelper {

    private ExclusionRuleHelper() {
    }

    public static boolean inListIgnoreCase(String value, List<String> list) {
        if (value == null || value.isBlank() || list == null || list.isEmpty()) {
            return false;
        }
        String normalized = value.trim().toLowerCase();
        for (String item : list) {
            if (item != null && item.trim().toLowerCase().equals(normalized)) {
                return true;
            }
        }
        return false;
    }

    public static boolean startsWithIgnoreCase(String value, String prefix) {
        if (value == null || prefix == null || value.isBlank()) {
            return false;
        }
        return value.trim().toUpperCase().startsWith(prefix.toUpperCase());
    }

    public static boolean isSavingProductCode(String productCode) {
        return startsWithIgnoreCase(productCode, "E") || startsWithIgnoreCase(productCode, "U");
    }

    public static boolean isProductNormsCode(String productCode) {
        return startsWithIgnoreCase(productCode, "G") || startsWithIgnoreCase(productCode, "I");
    }

    public static boolean isNri(String residentialStatus) {
        return residentialStatus != null && "N".equalsIgnoreCase(residentialStatus.trim());
    }
}
