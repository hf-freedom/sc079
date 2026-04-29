package com.rental.config;

import com.rental.entity.Car;
import com.rental.entity.Car.CarStatus;
import com.rental.entity.Car.CarType;
import com.rental.entity.User;
import com.rental.entity.User.CreditLevel;
import com.rental.repository.CarRepository;
import com.rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final CarRepository carRepository;

    @Bean
    public CommandLineRunner initializeData() {
        return args -> {
            if (userRepository.count() == 0) {
                log.info("Initializing users...");
                initializeUsers();
            }
            if (carRepository.count() == 0) {
                log.info("Initializing cars...");
                initializeCars();
            }
            log.info("Data initialization completed.");
        };
    }

    private void initializeUsers() {
        User user1 = User.builder()
                .username("zhangsan")
                .password("123456")
                .realName("张三")
                .idCard("110101199001011234")
                .phone("13800138001")
                .licenseNumber("A12345678")
                .licenseIssueDate(LocalDate.of(2015, 6, 15))
                .creditLevel(CreditLevel.EXCELLENT)
                .balance(new BigDecimal("10000.00"))
                .isBlacklisted(false)
                .violationCount(0)
                .overdueCount(0)
                .build();

        User user2 = User.builder()
                .username("lisi")
                .password("123456")
                .realName("李四")
                .idCard("310101199203155678")
                .phone("13800138002")
                .licenseNumber("B87654321")
                .licenseIssueDate(LocalDate.of(2018, 3, 20))
                .creditLevel(CreditLevel.GOOD)
                .balance(new BigDecimal("5000.00"))
                .isBlacklisted(false)
                .violationCount(1)
                .overdueCount(0)
                .build();

        User user3 = User.builder()
                .username("wangwu")
                .password("123456")
                .realName("王五")
                .idCard("440101198812259012")
                .phone("13800138003")
                .licenseNumber("C11223344")
                .licenseIssueDate(LocalDate.of(2010, 11, 8))
                .creditLevel(CreditLevel.FAIR)
                .balance(new BigDecimal("2000.00"))
                .isBlacklisted(false)
                .violationCount(3)
                .overdueCount(2)
                .build();

        userRepository.saveAll(Arrays.asList(user1, user2, user3));
        log.info("3 users initialized.");
    }

    private void initializeCars() {
        Car car1 = Car.builder()
                .plateNumber("京A12345")
                .brand("大众")
                .model("朗逸")
                .type(CarType.ECONOMY)
                .dailyRent(new BigDecimal("150.00"))
                .deposit(new BigDecimal("3000.00"))
                .status(CarStatus.AVAILABLE)
                .mileage(50000.0)
                .fuelLevel(100.0)
                .productionYear(2020)
                .color("白色")
                .build();

        Car car2 = Car.builder()
                .plateNumber("京B67890")
                .brand("丰田")
                .model("卡罗拉")
                .type(CarType.COMPACT)
                .dailyRent(new BigDecimal("200.00"))
                .deposit(new BigDecimal("5000.00"))
                .status(CarStatus.AVAILABLE)
                .mileage(35000.0)
                .fuelLevel(90.0)
                .productionYear(2021)
                .color("银色")
                .build();

        Car car3 = Car.builder()
                .plateNumber("京C24680")
                .brand("本田")
                .model("CR-V")
                .type(CarType.SUV)
                .dailyRent(new BigDecimal("350.00"))
                .deposit(new BigDecimal("8000.00"))
                .status(CarStatus.AVAILABLE)
                .mileage(20000.0)
                .fuelLevel(100.0)
                .productionYear(2022)
                .color("黑色")
                .build();

        Car car4 = Car.builder()
                .plateNumber("京D13579")
                .brand("奔驰")
                .model("E级")
                .type(CarType.LUXURY)
                .dailyRent(new BigDecimal("800.00"))
                .deposit(new BigDecimal("20000.00"))
                .status(CarStatus.AVAILABLE)
                .mileage(10000.0)
                .fuelLevel(100.0)
                .productionYear(2023)
                .color("黑色")
                .build();

        Car car5 = Car.builder()
                .plateNumber("京E98765")
                .brand("别克")
                .model("GL8")
                .type(CarType.COMMERCIAL)
                .dailyRent(new BigDecimal("400.00"))
                .deposit(new BigDecimal("10000.00"))
                .status(CarStatus.AVAILABLE)
                .mileage(45000.0)
                .fuelLevel(85.0)
                .productionYear(2021)
                .color("银色")
                .build();

        carRepository.saveAll(Arrays.asList(car1, car2, car3, car4, car5));
        log.info("5 cars initialized.");
    }
}
