package com.example.devops.config;

import jakarta.servlet.Filter;
import org.springframework.security.config.annotation.ObjectPostProcessor;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.Collections;
import java.util.List;

/**
 * Utility สำหรับสร้าง HttpSecurity ใน Unit Test (Spring Security 6)
 * และดึง filter ออกจาก SecurityFilterChain ผ่าน Reflection
 */
public class TestHttp {

    /** สร้าง HttpSecurity object แบบ minimal โดยใช้ Reflection */
    public static HttpSecurity build() throws Exception {
        Class<HttpSecurity> clazz = HttpSecurity.class;

        // หา constructor แบบ protected ของ HttpSecurity
        Constructor<HttpSecurity> cons = clazz.getDeclaredConstructor(
                ObjectPostProcessor.class,
                org.springframework.security.config.annotation.web.builders.WebSecurity.class,
                org.springframework.security.config.Customizer.class
        );
        cons.setAccessible(true);

        // Arg ทั้งหมดต้องไม่เป็น null
        ObjectPostProcessor<Object> opp = new ObjectPostProcessor<>() {
            @Override
            public <T> T postProcess(T object) {
                return object;
            }
        };

        // สร้าง instance
        return cons.newInstance(opp, null, null);
    }

    /** ดึง filters จาก SecurityFilterChain ผ่าน Reflection */
    @SuppressWarnings("unchecked")
    public static List<Filter> getFilters(SecurityFilterChain chain) {
        try {
            Field f = chain.getClass().getDeclaredField("filters");
            f.setAccessible(true);
            return (List<Filter>) f.get(chain);
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
