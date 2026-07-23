package com.icici.lifeclaim.rules.api;

import java.util.List;

public class AddExclusionResponse {

    private boolean excluded;
    private String exclusionType;
    private List<String> reasons;
    private String engineVersion;

    public AddExclusionResponse() {
    }

    public AddExclusionResponse(boolean excluded, String exclusionType, List<String> reasons, String engineVersion) {
        this.excluded = excluded;
        this.exclusionType = exclusionType;
        this.reasons = reasons;
        this.engineVersion = engineVersion;
    }

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

    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }

    public String getEngineVersion() {
        return engineVersion;
    }

    public void setEngineVersion(String engineVersion) {
        this.engineVersion = engineVersion;
    }
}
