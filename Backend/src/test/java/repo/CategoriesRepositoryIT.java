package com.example.devops.repo;

import com.example.devops.model.Categories;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class CategoriesRepositoryIT {

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private TestEntityManager entityManager;

    @BeforeEach
    void setUp() {
        categoriesRepository.deleteAll();
        entityManager.flush();
    }

    @Test
    void testSaveMultipleAndCount() {
        // Arrange & Act
        Categories cat1 = createCategory("Electronics", "Electronic devices", true);
        Categories cat2 = createCategory("Books", "Books and literature", true);
        Categories cat3 = createCategory("Clothing", "Fashion apparel", false);

        entityManager.persist(cat1);
        entityManager.persist(cat2);
        entityManager.persist(cat3);
        entityManager.flush();

        // Assert
        long count = categoriesRepository.count();
        assertEquals(3, count, "Should have 3 categories in database");
    }

    @Test
    void testEmptyNotFound() {
        // Act
        List<Categories> categories = categoriesRepository.findAll();

        // Assert
        assertTrue(categories.isEmpty(), "Repository should be empty initially");
    }

    @Test
    void testSaveAndFindAll() {
        // Arrange & Act
        Categories cat1 = createCategory("Sports", "Sports equipment", true);
        Categories cat2 = createCategory("Food", "Food and beverages", true);

        entityManager.persist(cat1);
        entityManager.persist(cat2);
        entityManager.flush();

        List<Categories> allCategories = categoriesRepository.findAll();

        // Assert
        assertNotNull(allCategories, "Result should not be null");
        assertEquals(2, allCategories.size(), "Should have 2 categories");
    }

    @Test
    void testSaveAndFindById() {
        // Arrange
        Categories category = createCategory("Technology", "Tech products", true);

        // Act
        entityManager.persist(category);
        entityManager.flush();

        Long id = getId(category);
        Categories found = entityManager.find(Categories.class, id);

        // Assert
        assertNotNull(found, "Category should be found");
        assertEquals(id, getId(found));
    }

    @Test
    void testUpdateCategory() {
        // Arrange
        Categories category = createCategory("Old Name", "Old Description", true);
        entityManager.persist(category);
        entityManager.flush();

        Long id = getId(category);

        // Act
        Categories toUpdate = entityManager.find(Categories.class, id);
        setField(toUpdate, "category_name", "New Name");
        setField(toUpdate, "description", "New Description");
        setField(toUpdate, "is_active", false);

        entityManager.flush();
        entityManager.clear();

        Categories updated = entityManager.find(Categories.class, id);

        // Assert
        assertNotNull(updated);
        assertEquals("New Name", getField(updated, "category_name"));
        assertEquals("New Description", getField(updated, "description"));
        assertEquals(false, getField(updated, "is_active"));
    }

    @Test
    void testDeleteCategory() {
        // Arrange
        Categories category = createCategory("To Delete", "Will be deleted", true);
        entityManager.persist(category);
        entityManager.flush();

        Long categoryId = getId(category);

        // Act
        entityManager.remove(category);
        entityManager.flush();

        // Assert
        Categories deleted = entityManager.find(Categories.class, categoryId);
        assertNull(deleted, "Category should be deleted");
    }

    // Helper methods - ไม่ set created_at
    private Categories createCategory(String name, String description, Boolean isActive) {
        try {
            Categories category = new Categories();
            setField(category, "category_name", name);
            setField(category, "description", description);
            setField(category, "is_active", isActive);
            // ไม่ต้อง set created_at ให้ database generate เอง
            return category;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create Categories", e);
        }
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field: " + fieldName, e);
        }
    }

    private Object getField(Object target, String fieldName) {
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            return field.get(target);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get field: " + fieldName, e);
        }
    }

    private Long getId(Categories category) {
        return (Long) getField(category, "category_id");
    }
}