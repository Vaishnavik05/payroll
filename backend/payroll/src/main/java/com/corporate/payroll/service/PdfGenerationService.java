package com.corporate.payroll.service;

import com.corporate.payroll.entity.EmployeePayroll;
import com.corporate.payroll.entity.SalaryBreakup;
import com.corporate.payroll.repository.SalaryBreakupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.io.font.constants.StandardFonts;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PdfGenerationService {
    
    private final SalaryBreakupRepository salaryBreakupRepository;
    
    public byte[] generatePayslipPdf(EmployeePayroll payroll) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        
        // Font setup
        PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        
        // Title
        Paragraph title = new Paragraph("PAYSLIP")
            .setFont(boldFont)
            .setFontSize(20)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(20);
        document.add(title);
        
        // Company and Period Info
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
        String period = payroll.getPayrollCycle().getStartDate() != null ? 
            dateFormatter.format(payroll.getPayrollCycle().getStartDate()) + " to " +
            dateFormatter.format(payroll.getPayrollCycle().getEndDate()) : "N/A";
        
        Table infoTable = new Table(2)
            .setWidth(UnitValue.createPercentValue(100))
            .setMarginBottom(20);
        
        infoTable.addCell(new Cell().add(new Paragraph("Employee Name").setFont(boldFont)));
        infoTable.addCell(new Cell().add(new Paragraph(payroll.getEmployee().getName())));
        infoTable.addCell(new Cell().add(new Paragraph("Employee Code").setFont(boldFont)));
        infoTable.addCell(new Cell().add(new Paragraph(payroll.getEmployee().getEmployeeCode())));
        infoTable.addCell(new Cell().add(new Paragraph("Department").setFont(boldFont)));
        infoTable.addCell(new Cell().add(new Paragraph(payroll.getEmployee().getDepartment() != null ? payroll.getEmployee().getDepartment() : "N/A")));
        infoTable.addCell(new Cell().add(new Paragraph("Pay Period").setFont(boldFont)));
        infoTable.addCell(new Cell().add(new Paragraph(period)));
        infoTable.addCell(new Cell().add(new Paragraph("Payment Date").setFont(boldFont)));
        infoTable.addCell(new Cell().add(new Paragraph(payroll.getPayrollCycle().getPaymentDate() != null ? 
            dateFormatter.format(payroll.getPayrollCycle().getPaymentDate()) : "Not Paid")));
        
        document.add(infoTable);
        
        // Salary Breakup
        List<SalaryBreakup> breakups = salaryBreakupRepository.findByEmployeePayroll(payroll);
        
        Paragraph earningsTitle = new Paragraph("EARNINGS")
            .setFont(boldFont)
            .setFontSize(14)
            .setMarginTop(20)
            .setMarginBottom(10);
        document.add(earningsTitle);
        
        Table earningsTable = new Table(2)
            .setWidth(UnitValue.createPercentValue(100))
            .setMarginBottom(15);
        
        earningsTable.addCell(new Cell().add(new Paragraph("Component").setFont(boldFont)));
        earningsTable.addCell(new Cell().add(new Paragraph("Amount (Rs.)").setFont(boldFont)));
        
        NumberFormat currencyFormat = NumberFormat.getInstance(Locale.US);
        
        double totalEarnings = 0;
        for (SalaryBreakup breakup : breakups) {
            if ("EARNING".equals(breakup.getComponentType())) {
                earningsTable.addCell(new Cell().add(new Paragraph(breakup.getComponentName())));
                earningsTable.addCell(new Cell().add(new Paragraph(currencyFormat.format(breakup.getAmount()))));
                totalEarnings += breakup.getAmount();
            }
        }
        
        earningsTable.addCell(new Cell().add(new Paragraph("Total Earnings").setFont(boldFont)));
        earningsTable.addCell(new Cell().add(new Paragraph(currencyFormat.format(totalEarnings)).setFont(boldFont)));
        
        document.add(earningsTable);
        
        // Deductions
        Paragraph deductionsTitle = new Paragraph("DEDUCTIONS")
            .setFont(boldFont)
            .setFontSize(14)
            .setMarginTop(20)
            .setMarginBottom(10);
        document.add(deductionsTitle);
        
        Table deductionsTable = new Table(2)
            .setWidth(UnitValue.createPercentValue(100))
            .setMarginBottom(15);
        
        deductionsTable.addCell(new Cell().add(new Paragraph("Component").setFont(boldFont)));
        deductionsTable.addCell(new Cell().add(new Paragraph("Amount (Rs.)").setFont(boldFont)));
        
        double totalDeductions = 0;
        for (SalaryBreakup breakup : breakups) {
            if ("DEDUCTION".equals(breakup.getComponentType())) {
                deductionsTable.addCell(new Cell().add(new Paragraph(breakup.getComponentName())));
                deductionsTable.addCell(new Cell().add(new Paragraph(currencyFormat.format(breakup.getAmount()))));
                totalDeductions += breakup.getAmount();
            }
        }
        
        deductionsTable.addCell(new Cell().add(new Paragraph("Total Deductions").setFont(boldFont)));
        deductionsTable.addCell(new Cell().add(new Paragraph(currencyFormat.format(totalDeductions)).setFont(boldFont)));
        
        document.add(deductionsTable);
        
        // Summary
        Paragraph summaryTitle = new Paragraph("SUMMARY")
            .setFont(boldFont)
            .setFontSize(14)
            .setMarginTop(20)
            .setMarginBottom(10);
        document.add(summaryTitle);
        
        Table summaryTable = new Table(2)
            .setWidth(UnitValue.createPercentValue(100));
        
        summaryTable.addCell(new Cell().add(new Paragraph("Gross Salary").setFont(boldFont)));
        summaryTable.addCell(new Cell().add(new Paragraph(currencyFormat.format(payroll.getGross()))));
        summaryTable.addCell(new Cell().add(new Paragraph("Total Deductions").setFont(boldFont)));
        summaryTable.addCell(new Cell().add(new Paragraph(currencyFormat.format(payroll.getTotalDeductions()))));
        summaryTable.addCell(new Cell().add(new Paragraph("Net Salary").setFont(boldFont)));
        summaryTable.addCell(new Cell().add(new Paragraph(currencyFormat.format(payroll.getNetSalary())).setFont(boldFont)));
        
        document.add(summaryTable);
        
        // Footer
        Paragraph footer = new Paragraph("This is a computer-generated payslip and does not require signature.")
            .setFont(font)
            .setFontSize(10)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginTop(30);
        document.add(footer);
        
        document.close();
        
        return baos.toByteArray();
    }
}
