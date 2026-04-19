package com.example.demo.models;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {
    
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String company;
    
    @Column(unique = true, nullable = false)
    private String login;
    
    @Column(nullable = false)
    private String passwordHash; // Храним только хэш!
    
    private String apiToken;

    // Один ко многим: один юзер -> много записей звонков
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CallRecord> callRecords = new ArrayList<>();
}