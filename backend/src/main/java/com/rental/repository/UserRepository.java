package com.rental.repository;

import com.rental.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByPhone(String phone);
    Optional<User> findByLicenseNumber(String licenseNumber);
    Optional<User> findByIdCard(String idCard);
    boolean existsByUsername(String username);
    boolean existsByPhone(String phone);
    boolean existsByLicenseNumber(String licenseNumber);
}
