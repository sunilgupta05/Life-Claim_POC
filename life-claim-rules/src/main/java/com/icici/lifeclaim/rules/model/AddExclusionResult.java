package com.icici.lifeclaim.rules.model;

import java.util.ArrayList;
import java.util.List;

public class AddExclusionResult {

    private boolean excluded;
    private String exclusionType;
    private final List<String> reasons = new ArrayList<>();

    public boolean isExcluded() {
        return excluded;
    }

    public void setExcluded(boolean excluded) {
        this.excluded = excluded;
    }

    public String getExclusionType() {
        return exclusionType;
    }

    public void setExclusionType(String exclusionType) {
        this.exclusionType = exclusionType;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public void addReason(String reason) {
        this.reasons.add(reason);
    }
}
