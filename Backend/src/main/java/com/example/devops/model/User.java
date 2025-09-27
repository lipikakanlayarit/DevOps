package com.example.devops.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id") // ถ้าคอลัมน์จริงคือ id ให้เปลี่ยนเป็น "id"
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String username;

    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    // ตารางใช้ 'roles' (พหูพจน์) แต่เราจะ expose เป็น getRole()
    @Column(name = "roles", nullable = false, length = 50)
    private String role;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(name = "id_card_passport", length = 30)
    private String idCardPassport;

    // getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; } // กลับค่า password_hash
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; } // กลับค่าจากคอลัมน์ 'roles'
    public void setRole(String role) { this.role = role; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getIdCardPassport() { return idCardPassport; }
    public void setIdCardPassport(String idCardPassport) { this.idCardPassport = idCardPassport; }
}
