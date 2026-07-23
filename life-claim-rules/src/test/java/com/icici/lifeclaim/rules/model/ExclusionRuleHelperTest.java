package com.icici.lifeclaim.rules.model;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class ExclusionRuleHelperTest {

    @Test
    void matchesListIgnoreCase() {
        assertTrue(ExclusionRuleHelper.inListIgnoreCase("Active", List.of("active", "lapsed")));
        assertFalse(ExclusionRuleHelper.inListIgnoreCase("Paid", List.of("active", "lapsed")));
    }

    @Test
    void detectsSavingProductCodes() {
        assertTrue(ExclusionRuleHelper.isSavingProductCode("E123"));
        assertTrue(ExclusionRuleHelper.isSavingProductCode("u99"));
        assertFalse(ExclusionRuleHelper.isSavingProductCode("G123"));
    }
}
