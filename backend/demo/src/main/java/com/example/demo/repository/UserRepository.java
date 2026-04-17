package com.example.demo.repository;
import com.example.demo.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Понадобится для входа в систему
    Optional<User> findByLogin(String login);
    
    // Для проверки уникальности токена
    Optional<User> findByApiToken(String apiToken);
}
