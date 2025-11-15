package com.example.devops.web;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class HealthControllerTest {

    @Test
    void testHealth() throws Exception {
        // Arrange
        HealthController controller = new HealthController();
        MockMvc mvc = standaloneSetup(controller).build();

        // Act
        var result = mvc.perform(get("/api/health")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andReturn();

        // Assert JSON response
        String json = result.getResponse().getContentAsString();
        assertThat(json).contains("\"status\":\"ok\"");
    }

    @Test
    void testHealth_directMethodCall() {
        HealthController controller = new HealthController();

        Map<String, Object> resp = controller.health();

        assertThat(resp).containsEntry("status", "ok");
    }
}
