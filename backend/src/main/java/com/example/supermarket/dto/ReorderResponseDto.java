package com.example.supermarket.dto;

import java.util.List;

public class ReorderResponseDto {
    private int itemsAdded;
    private int itemsUnavailable;
    private List<String> unavailableProductNames;

    public ReorderResponseDto() {}

    public ReorderResponseDto(int itemsAdded, int itemsUnavailable, List<String> unavailableProductNames) {
        this.itemsAdded = itemsAdded;
        this.itemsUnavailable = itemsUnavailable;
        this.unavailableProductNames = unavailableProductNames;
    }

    public int getItemsAdded() {
        return itemsAdded;
    }

    public void setItemsAdded(int itemsAdded) {
        this.itemsAdded = itemsAdded;
    }

    public int getItemsUnavailable() {
        return itemsUnavailable;
    }

    public void setItemsUnavailable(int itemsUnavailable) {
        this.itemsUnavailable = itemsUnavailable;
    }

    public List<String> getUnavailableProductNames() {
        return unavailableProductNames;
    }

    public void setUnavailableProductNames(List<String> unavailableProductNames) {
        this.unavailableProductNames = unavailableProductNames;
    }
}
