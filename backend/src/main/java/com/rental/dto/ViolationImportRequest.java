package com.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationImportRequest {

    @NotBlank(message = "车牌号不能为空")
    private String plateNumber;

    @NotNull(message = "违章时间不能为空")
    private LocalDateTime violationTime;

    @NotBlank(message = "违章地点不能为空")
    private String location;

    @NotBlank(message = "违章类型不能为空")
    private String type;

    @NotNull(message = "罚款金额不能为空")
    @Positive(message = "罚款金额必须大于0")
    private BigDecimal fineAmount;

    @NotNull(message = "扣分不能为空")
    private Integer penaltyPoints;

    private String source;
    private String remark;
}
