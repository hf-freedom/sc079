package com.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequest {

    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @NotNull(message = "还车时里程不能为空")
    @Positive(message = "里程必须大于0")
    private Double returnMileage;

    @NotNull(message = "还车时油量不能为空")
    @Positive(message = "油量必须大于等于0")
    private Double returnFuelLevel;

    private List<DamageInfo> damages;

    private String remark;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DamageInfo {
        private String type;
        private String location;
        private String description;
        private String level;
        private BigDecimal estimatedCost;
    }
}
