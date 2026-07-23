package com.icici.lifeclaim.rules.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.icici.lifeclaim.rules.api.AddExclusionResponse;
import com.icici.lifeclaim.rules.model.AddExclusionFacts;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AddExclusionRulesServiceTest {

    private AddExclusionRulesService service;

    @BeforeEach
    void setUp() {
        service = new AddExclusionRulesService();
        service.initKieContainer();
    }

    @Test
    void excludesWhenRcdIsThreeYearsOrMore() {
        AddExclusionFacts facts = baseFacts();
        facts.setContractPresent(true);
        facts.setRcdYears(4);

        AddExclusionResponse response = service.evaluate(facts);

        assertTrue(response.isExcluded());
        assertEquals("RCD more than 3 years", response.getExclusionType());
    }

    @Test
    void doesNotExcludeWhenRcdUnderThreeYears() {
        AddExclusionFacts facts = baseFacts();
        facts.setContractPresent(true);
        facts.setRcdYears(2);

        AddExclusionResponse response = service.evaluate(facts);

        assertFalse(response.isExcluded());
    }

    @Test
    void excludesNriCustomer() {
        AddExclusionFacts facts = baseFacts();
        facts.setLifeAssuredPresent(true);
        facts.setResidentialStatus("N");

        AddExclusionResponse response = service.evaluate(facts);

        assertTrue(response.isExcluded());
        assertEquals("NRI customer", response.getExclusionType());
    }

    @Test
    void excludesClaimReceivedFromMasterList() {
        AddExclusionFacts facts = baseFacts();
        facts.setClaimType("Claim Received Status");
        facts.setClaimReceivedValues(List.of("Claim Received Status"));

        AddExclusionResponse response = service.evaluate(facts);

        assertTrue(response.isExcluded());
        assertEquals("Claim Received", response.getExclusionType());
    }

    @Test
    void excludesMinorLifeAssured() {
        AddExclusionFacts facts = baseFacts();
        facts.setLifeAssuredPresent(true);
        facts.setAgeInYears(16);

        AddExclusionResponse response = service.evaluate(facts);

        assertTrue(response.isExcluded());
        assertEquals("Minor Life Assured", response.getExclusionType());
    }

    private static AddExclusionFacts baseFacts() {
        AddExclusionFacts facts = new AddExclusionFacts();
        facts.setCaseId(1L);
        return facts;
    }
}
