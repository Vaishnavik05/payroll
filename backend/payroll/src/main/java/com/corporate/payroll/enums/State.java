package com.corporate.payroll.enums;

public enum State {
    ANDHRA_PRADESH("Andhra Pradesh", 17850.0),
    ARUNACHAL_PRADESH("Arunachal Pradesh", 16500.0),
    ASSAM("Assam", 15400.0),
    BIHAR("Bihar", 16000.0),
    CHHATTISGARH("Chhattisgarh", 15600.0),
    GOA("Goa", 19000.0),
    GUJARAT("Gujarat", 18000.0),
    HARYANA("Haryana", 17900.0),
    HIMACHAL_PRADESH("Himachal Pradesh", 15800.0),
    JHARKHAND("Jharkhand", 17000.0),
    KARNATAKA("Karnataka", 17000.0),
    KERALA("Kerala", 17000.0),
    MADHYA_PRADESH("Madhya Pradesh", 16500.0),
    MAHARASHTRA("Maharashtra", 18000.0),
    MANIPUR("Manipur", 14000.0),
    MEGHALAYA("Meghalaya", 16000.0),
    MIZORAM("Mizoram", 16500.0),
    NAGALAND("Nagaland", 15000.0),
    ODISHA("Odisha", 15800.0),
    PUNJAB("Punjab", 18000.0),
    RAJASTHAN("Rajasthan", 17500.0),
    SIKKIM("Sikkim", 15800.0),
    TAMIL_NADU("Tamil Nadu", 17400.0),
    TELANGANA("Telangana", 17850.0),
    TRIPURA("Tripura", 14000.0),
    UTTARAKHAND("Uttarakhand", 15800.0),
    UTTAR_PRADESH("Uttar Pradesh", 16900.0),
    WEST_BENGAL("West Bengal", 17000.0),
    DELHI("Delhi", 17900.0),
    JAMMU_KASHMIR("Jammu & Kashmir", 15000.0),
    LADAKH("Ladakh", 15000.0),
    PUDUCHERRY("Puducherry", 15900.0);

    private final String displayName;
    private final Double minimumMonthlyWage;

    State(String displayName, Double minimumMonthlyWage) {
        this.displayName = displayName;
        this.minimumMonthlyWage = minimumMonthlyWage;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Double getMinimumMonthlyWage() {
        return minimumMonthlyWage;
    }
}
