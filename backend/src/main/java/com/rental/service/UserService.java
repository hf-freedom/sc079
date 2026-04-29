package com.rental.service;

import com.rental.entity.User;
import com.rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DepositService depositService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        if (userRepository.existsByPhone(user.getPhone())) {
            throw new RuntimeException("手机号已存在");
        }
        if (userRepository.existsByLicenseNumber(user.getLicenseNumber())) {
            throw new RuntimeException("驾照号已存在");
        }
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        user.setRealName(userDetails.getRealName());
        user.setPhone(userDetails.getPhone());
        user.setLicenseNumber(userDetails.getLicenseNumber());
        user.setLicenseIssueDate(userDetails.getLicenseIssueDate());
        
        return userRepository.save(user);
    }

    @Transactional
    public User recharge(Long userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("充值金额必须大于0");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        user.setBalance(user.getBalance().add(amount));
        log.info("用户 {} 充值 {} 元，当前余额: {}", user.getUsername(), amount, user.getBalance());
        
        return userRepository.save(user);
    }

    @Transactional
    public void toggleBlacklist(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        user.setIsBlacklisted(!user.getIsBlacklisted());
        log.info("用户 {} 黑名单状态更新为: {}", user.getUsername(), user.getIsBlacklisted());
        
        userRepository.save(user);
    }

    public BigDecimal getUserTotalBalance(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        BigDecimal frozenDeposit = depositService.getUserFrozenDeposit(userId);
        return user.getBalance().add(frozenDeposit);
    }
}
