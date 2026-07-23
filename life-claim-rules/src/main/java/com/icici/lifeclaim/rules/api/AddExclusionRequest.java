package com.icici.lifeclaim.rules.api;

import java.util.ArrayList;
import java.util.List;

public class AddExclusionRequest {

    private Long caseId;
    private boolean contractPresent;
    private boolean lifeAssuredPresent;
    private String claimType;
    private String policyStatus;
    private int rcdYears;
    private double annualPremium;
    private double premiumAmount;
    private double premiumFrequency;
    private String productCode;
    private String residentialStatus;
    private String advisorCode;
    private String partnerName;
    private int ageInYears;
    private List<String> claimReceivedValues = new ArrayList<>();
    private List<String> inactivePolicyStatusValues = new ArrayList<>();
    private List<String> topAdvisorValues = new ArrayList<>();
    private List<String> partnerExclusionValues = new ArrayList<>();
    private List<String> productNormsValues = new ArrayList<>();
    private List<String> ulipPolicyValues = new ArrayList<>();

    public Long getCaseId() {
        return caseId;
    }

    public void setCaseId(Long caseId) {
        this.caseId = caseId;
    }

    public boolean isContractPresent() {
        return contractPresent;
    }

    public void setContractPresent(boolean contractPresent) {
        this.contractPresent = contractPresent;
    }

    public boolean isLifeAssuredPresent() {
        return lifeAssuredPresent;
    }

    public void setLifeAssuredPresent(boolean lifeAssuredPresent) {
        this.lifeAssuredPresent = lifeAssuredPresent;
    }

    public String getClaimType() {
        return claimType;
    }

    public void setClaimType(String claimType) {
        this.claimType = claimType;
    }

    public String getPolicyStatus() {
        return policyStatus;
    }

    public void setPolicyStatus(String policyStatus) {
        this.policyStatus = policyStatus;
    }

    public int getRcdYears() {
        return rcdYears;
    }

    public void setRcdYears(int rcdYears) {
        this.rcdYears = rcdYears;
    }

    public double getAnnualPremium() {
        return annualPremium;
    }

    public void setAnnualPremium(double annualPremium) {
        this.annualPremium = annualPremium;
    }

    public double getPremiumAmount() {
        return premiumAmount;
    }

    public void setPremiumAmount(double premiumAmount) {
        this.premiumAmount = premiumAmount;
    }

    public double getPremiumFrequency() {
        return premiumFrequency;
    }

    public void setPremiumFrequency(double premiumFrequency) {
        this.premiumFrequency = premiumFrequency;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getResidentialStatus() {
        return residentialStatus;
    }

    public void setResidentialStatus(String residentialStatus) {
        this.residentialStatus = residentialStatus;
    }

    public String getAdvisorCode() {
        return advisorCode;
    }

    public void setAdvisorCode(String advisorCode) {
        this.advisorCode = advisorCode;
    }

    public String getPartnerName() {
        return partnerName;
    }

    public void setPartnerName(String partnerName) {
        this.partnerName = partnerName;
    }

    public int getAgeInYears() {
        return ageInYears;
    }

    public void setAgeInYears(int ageInYears) {
        this.ageInYears = ageInYears;
    }

    public List<String> getClaimReceivedValues() {
        return claimReceivedValues;
    }

    public void setClaimReceivedValues(List<String> claimReceivedValues) {
        this.claimReceivedValues = claimReceivedValues;
    }

    public List<String> getInactivePolicyStatusValues() {
        return inactivePolicyStatusValues;
    }

    public void setInactivePolicyStatusValues(List<String> inactivePolicyStatusValues) {
        this.inactivePolicyStatusValues = inactivePolicyStatusValues;
    }

    public List<String> getTopAdvisorValues() {
        return topAdvisorValues;
    }

    public void setTopAdvisorValues(List<String> topAdvisorValues) {
        this.topAdvisorValues = topAdvisorValues;
    }

    public List<String> getPartnerExclusionValues() {
        return partnerExclusionValues;
    }

    public void setPartnerExclusionValues(List<String> partnerExclusionValues) {
        this.partnerExclusionValues = partnerExclusionValues;
    }

    public List<String> getProductNormsValues() {
        return productNormsValues;
    }

    public void setProductNormsValues(List<String> productNormsValues) {
        this.productNormsValues = productNormsValues;
    }

    public List<String> getUlipPolicyValues() {
        return ulipPolicyValues;
    }

    public void setUlipPolicyValues(List<String> ulipPolicyValues) {
        this.ulipPolicyValues = ulipPolicyValues;
    }
}
