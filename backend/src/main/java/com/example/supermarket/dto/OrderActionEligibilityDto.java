package com.example.supermarket.dto;

public record OrderActionEligibilityDto(
    boolean canCancel,
    boolean canRequestReturn,
    boolean hasActiveCancellation,
    boolean hasActiveReturn,
    String cancelIneligibleReason,
    String returnIneligibleReason,
    CancellationRequestDto cancellation,
    ReturnRequestDto returnRequest
) {}
