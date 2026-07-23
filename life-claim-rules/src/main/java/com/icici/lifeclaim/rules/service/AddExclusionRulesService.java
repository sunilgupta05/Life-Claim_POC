package com.icici.lifeclaim.rules.service;

import com.icici.lifeclaim.rules.api.AddExclusionResponse;
import com.icici.lifeclaim.rules.model.AddExclusionFacts;
import com.icici.lifeclaim.rules.model.AddExclusionResult;
import jakarta.annotation.PostConstruct;
import org.kie.api.KieServices;
import org.kie.api.builder.KieBuilder;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.KieModule;
import org.kie.api.builder.Message;
import org.kie.api.builder.Results;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.kie.internal.io.ResourceFactory;
import org.springframework.stereotype.Service;

@Service
public class AddExclusionRulesService {

    private static final String ENGINE_VERSION = "1.0.0-add-exclusion-all";
    private static final String DRL_RESOURCE = "rules/add-exclusion.drl";

    private KieContainer kieContainer;

    @PostConstruct
    void initKieContainer() {
        KieServices kieServices = KieServices.Factory.get();
        KieFileSystem kieFileSystem = kieServices.newKieFileSystem();
        kieFileSystem.write(
            ResourceFactory.newClassPathResource(DRL_RESOURCE, getClass().getClassLoader())
        );

        KieBuilder kieBuilder = kieServices.newKieBuilder(kieFileSystem).buildAll();
        Results results = kieBuilder.getResults();
        if (results.hasMessages(Message.Level.ERROR)) {
            throw new IllegalStateException(
                "Drools compile errors: " + results.getMessages(Message.Level.ERROR)
            );
        }

        KieModule kieModule = kieBuilder.getKieModule();
        kieContainer = kieServices.newKieContainer(kieModule.getReleaseId());
    }

    public AddExclusionResponse evaluate(AddExclusionFacts facts) {
        AddExclusionFacts safeFacts = facts != null ? facts : new AddExclusionFacts();
        AddExclusionResult result = new AddExclusionResult();

        KieSession session = kieContainer.newKieSession();
        try {
            session.insert(safeFacts);
            session.insert(result);
            session.fireAllRules();
        } finally {
            session.dispose();
        }

        return new AddExclusionResponse(
            result.isExcluded(),
            result.getExclusionType(),
            result.getReasons(),
            ENGINE_VERSION
        );
    }
}
