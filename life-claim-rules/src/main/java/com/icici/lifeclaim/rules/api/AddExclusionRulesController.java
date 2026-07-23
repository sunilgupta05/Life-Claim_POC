package com.icici.lifeclaim.rules.api;

import com.icici.lifeclaim.rules.model.AddExclusionFacts;
import com.icici.lifeclaim.rules.service.AddExclusionRulesService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rules")
public class AddExclusionRulesController {

    private final AddExclusionRulesService rulesService;

    public AddExclusionRulesController(AddExclusionRulesService rulesService) {
        this.rulesService = rulesService;
    }

    @PostMapping("/add-exclusion")
    public AddExclusionResponse evaluate(@RequestBody(required = false) AddExclusionRequest request) {
        return rulesService.evaluate(toFacts(request));
    }

    private static AddExclusionFacts toFacts(AddExclusionRequest request) {
        AddExclusionFacts facts = new AddExclusionFacts();
        if (request == null) {
            return facts;
        }
        facts.setCaseId(request.getCaseId());
        facts.setContractPresent(request.isContractPresent());
        facts.setLifeAssuredPresent(request.isLifeAssuredPresent());
        facts.setClaimType(request.getClaimType());
        facts.setPolicyStatus(request.getPolicyStatus());
        facts.setRcdYears(request.getRcdYears());
        facts.setAnnualPremium(request.getAnnualPremium());
        facts.setPremiumAmount(request.getPremiumAmount());
        facts.setPremiumFrequency(request.getPremiumFrequency());
        facts.setProductCode(request.getProductCode());
        facts.setResidentialStatus(request.getResidentialStatus());
        facts.setAdvisorCode(request.getAdvisorCode());
        facts.setPartnerName(request.getPartnerName());
        facts.setAgeInYears(request.getAgeInYears());
        facts.setClaimReceivedValues(request.getClaimReceivedValues());
        facts.setInactivePolicyStatusValues(request.getInactivePolicyStatusValues());
        facts.setTopAdvisorValues(request.getTopAdvisorValues());
        facts.setPartnerExclusionValues(request.getPartnerExclusionValues());
        facts.setProductNormsValues(request.getProductNormsValues());
        facts.setUlipPolicyValues(request.getUlipPolicyValues());
        return facts;
    }
}
