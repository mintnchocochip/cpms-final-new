#!/usr/bin/env node
/**
 * Student Review Updater - Node.js Version for BTech only
 * Uses individual PUT /:regNo endpoint for each BTech student
 * Processes ALL BTech students with component-level marks + PPT approval
 */

const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// Configuration
const EXCEL_FILE_PATH = '/home/administrator/Desktop/excel-files/Upload/final_mark_update.xlsx';
const API_BASE_URL = 'http://localhost:5000/api/student';
const AUTH_TOKEN = 
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Zjg5N2JlMjJiN2QwODQ3NDRmNjU0OCIsImVtYWlsSWQiOiJhZG1pbkB2aXQuYWMuaW4iLCJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjIxNjAyNjcsImV4cCI6MTc2MjI0NjY2N30.AglEajyA4hzsWEh1VPbgmZH3TtrVneA3h_eJq9ulMow"
class StudentReviewUpdater {
    constructor(excelFilePath, apiBaseUrl, authToken, dryRun = false) {
        this.excelFilePath = excelFilePath;
        this.apiBaseUrl = apiBaseUrl;
        this.authToken = authToken;
        this.dryRun = dryRun;

        this.componentMapping = {
            'BTech': {
                'draftReview': {
                    excelPrefix: 'Zero-th Review',
                    components: ['Title & Problem Statement'],
                    isDummy: true
                },
                'panelReview1': {
                    excelPrefix: 'Review 1',
                    components: [
                        'Problem Statement & Motivation',
                        'Literature Review & Gap Identification',
                        'Objective & Scope',
                        'Proposed methodology & Feasability',
                        'Presentation & Communication'
                    ],
                    isDummy: false
                },
                'guideReview1': {
                    excelPrefix: 'Dummy ',
                    components: ['test'],
                    isDummy: true
                }
            }
        };

        this.failedUpdates = [];
        this.successfulUpdates = [];
        this.totalStudentsProcessed = 0;
        this.totalReviewsSkipped = 0;
        this.logFile = `update_log_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${level} - ${message}`;
        console.log(logMessage);
        fs.appendFileSync(this.logFile, logMessage + '\n');
    }

    loadExcelData() {
        try {
            this.log(`Loading Excel file: ${this.excelFilePath}`);
            const workbook = XLSX.readFile(this.excelFilePath);
            this.sheetData = {};

            for (const sheetName of workbook.SheetNames) {
                // ✅ CORRECTED: Match your actual sheet name pattern
                if (!sheetName.toLowerCase().includes('btech')) continue;
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                this.sheetData[sheetName] = jsonData;
                this.log(`Loaded sheet '${sheetName}' with ${jsonData.length} students`);
            }

            if (Object.keys(this.sheetData).length === 0) {
                this.log('No BTech sheet found in Excel file', 'ERROR');
                return false;
            }
            return true;
        } catch (error) {
            this.log(`Failed to load Excel file: ${error.message}`, 'ERROR');
            return false;
        }
    }

    extractComponentMarks(row, reviewConfig, excelPrefix) {
        const componentMarks = {};
        for (const componentName of reviewConfig.components) {
            const colName = `${excelPrefix}_${componentName}`;
            if (row[colName] !== undefined && row[colName] !== null && row[colName] !== '') {
                const mark = parseFloat(row[colName]);
                if (!isNaN(mark)) {
                    componentMarks[componentName] = mark;
                }
            }
        }
        return componentMarks;
    }

    processStudentRow(row) {
        const regNo = String(row['Register No'] || '').trim();
        const studentName = String(row['Name'] || '').trim();
        if (!regNo) {
            this.log('Skipping row with no valid registration number', 'WARN');
            return null;
        }
        this.log(`Processing: ${studentName} (${regNo})`);

        const patDetected = String(row['PAT_Detected'] || '').toLowerCase() === 'yes';
        const deptMapping = this.componentMapping['BTech'];
        const marksUpdate = [];

        for (const [reviewName, reviewConfig] of Object.entries(deptMapping)) {
            if (reviewConfig.isDummy) {
                this.totalReviewsSkipped++;
                continue;
            }

            const componentMarks = this.extractComponentMarks(row, reviewConfig, reviewConfig.excelPrefix);
            const comments = row[`${reviewConfig.excelPrefix}_Comments`] || '';
            const attendancePresent = String(row[`${reviewConfig.excelPrefix}_Attendance`] || '').toLowerCase() === 'present';
            
            // ✅ CRITICAL: Extract PPT Approval status from Excel
            const pptApprovalColumn = `${reviewConfig.excelPrefix}_PPT_Approved`;
            const pptApprovalValue = String(row[pptApprovalColumn] || '').toLowerCase();
            const pptApproved = pptApprovalValue === 'yes';

            const reviewData = {
                reviewName,
                marks: componentMarks,
                comments: String(comments).trim(),
                attendance: { value: attendancePresent, locked: false },
                locked: false
            };

            // ✅ ALWAYS include pptApproved (backend expects it)
            if (row[pptApprovalColumn] !== undefined && row[pptApprovalColumn] !== null && row[pptApprovalColumn] !== '') {
                reviewData.pptApproved = pptApproved;
                this.log(`  📋 ${reviewName} - PPT Approved: ${pptApproved ? 'YES' : 'NO'}`);
            }

            marksUpdate.push(reviewData);

            const marksSum = Object.values(componentMarks).reduce((a, b) => a + b, 0);
            this.log(`  ✓ ${reviewName}: ${Object.keys(componentMarks).length} components, Total: ${marksSum}, Attendance: ${attendancePresent ? 'Present' : 'Absent'}, PPT: ${pptApproved ? 'Approved' : 'Not Approved'}`);
        }

        return {
            regNo,
            name: studentName,
            payload: { marksUpdate, PAT: patDetected }
        };
    }

    async sendStudentUpdate(regNo, payload) {
        if (this.dryRun) {
            this.log(`[DRY RUN] Would update student: ${regNo}`);
            this.log(`[DRY RUN] Payload: ${JSON.stringify(payload, null, 2)}`);
            return { success: true };
        }
        try {
            const url = `${this.apiBaseUrl}/${regNo}`;
            this.log(`PUT ${url}`);
            this.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
            const response = await axios.put(url, payload, {
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${this.authToken}` 
                },
                timeout: 30000
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response
                    ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 200)}`
                    : `Request failed: ${error.message}`
            };
        }
    }

    async processSheet(sheetName, data) {
        this.log(`\n${'='.repeat(60)}`);
        this.log(`Processing sheet: ${sheetName} with ${data.length} students`);
        this.log('='.repeat(60));
        let processedCount = 0;

        for (const row of data) {
            try {
                const studentData = this.processStudentRow(row);
                if (!studentData) continue;

                const { regNo, name, payload } = studentData;
                const result = await this.sendStudentUpdate(regNo, payload);

                if (result.success) {
                    this.successfulUpdates.push({ 
                        sheet: sheetName, 
                        reg_no: regNo, 
                        name, 
                        reviews_count: payload.marksUpdate.length 
                    });
                    this.log(`✅ Successfully updated: ${name} (${regNo})`);
                    processedCount++;
                } else {
                    this.failedUpdates.push({ 
                        sheet: sheetName, 
                        reg_no: regNo, 
                        name, 
                        error: result.error 
                    });
                    this.log(`❌ Failed to update ${name} (${regNo}): ${result.error}`, 'ERROR');
                }

                // Rate limiting
                await new Promise(r => setTimeout(r, 100));
            } catch (error) {
                this.log(`Error processing student row: ${error.message}`, 'ERROR');
            }
        }
        return processedCount;
    }

    async processAllSheets() {
        if (!this.loadExcelData()) return false;

        this.totalStudentsProcessed = 0;
        for (const [sheetName, data] of Object.entries(this.sheetData)) {
            const count = await this.processSheet(sheetName, data);
            this.totalStudentsProcessed += count;
        }

        this.log(`\n${'='.repeat(60)}`);
        this.log(`FINAL SUMMARY: Processed ${this.totalStudentsProcessed} students`);
        this.log(`✅ Successful: ${this.successfulUpdates.length}`);
        this.log(`❌ Failed: ${this.failedUpdates.length}`);
        this.log(`⏭️  Skipped dummy reviews: ${this.totalReviewsSkipped}`);
        this.log('='.repeat(60));
        return true;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            dry_run: this.dryRun,
            summary: {
                total_students_processed: this.totalStudentsProcessed,
                total_successful: this.successfulUpdates.length,
                total_failed: this.failedUpdates.length,
                total_reviews_skipped: this.totalReviewsSkipped
            },
            successful_updates: this.successfulUpdates,
            failed_updates: this.failedUpdates
        };

        const reportFilename = `update_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
        this.log(`\n📄 Report saved: ${reportFilename}`);

        console.log('\n' + '='.repeat(60));
        console.log('=== FINAL UPDATE SUMMARY ===');
        console.log('='.repeat(60));
        console.log(`📊 Total Processed: ${report.summary.total_students_processed}`);
        console.log(`✅ Successful: ${report.summary.total_successful}`);
        console.log(`❌ Failed: ${report.summary.total_failed}`);
        console.log(`⏭️  Skipped (dummy reviews): ${report.summary.total_reviews_skipped}`);

        if (this.failedUpdates.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('=== FAILED UPDATES (First 10) ===');
            console.log('='.repeat(60));
            this.failedUpdates.slice(0, 10).forEach(({ name, reg_no, error }, i) =>
                console.log(`${i + 1}. ${name} (${reg_no})\n   Error: ${error}\n`));
            if (this.failedUpdates.length > 10) {
                console.log(`... +${this.failedUpdates.length - 10} more failures (see report)`);
            }
        }
        console.log('='.repeat(60));
        return report;
    }
}

function askQuestion(query) {
    const rl = readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('=== Student Review Updater - BTech Only ===');
    console.log('='.repeat(60));
    
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.error(`\n❌ File not found: ${EXCEL_FILE_PATH}`);
        process.exit(1);
    }

    console.log(`\n📄 Excel File: ${EXCEL_FILE_PATH}`);
    console.log(`🌐 API Endpoint: ${API_BASE_URL}/:regNo`);
    console.log(`🔐 Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`);
    
    console.log('\n' + '='.repeat(60));
    console.log('SELECT MODE:');
    console.log('='.repeat(60));
    console.log('1. DRY RUN (test without database updates)');
    console.log('2. LIVE MODE (update database)\n');
    
    const mode = await askQuestion('Enter mode (1 or 2): ');
    const dryRun = mode.trim() === '1';
    
    if (!dryRun) {
        console.log('\n' + '='.repeat(60));
        console.log('⚠️  WARNING: LIVE MODE - DATABASE WILL BE UPDATED!');
        console.log('='.repeat(60));
        const confirm = await askQuestion("\nType 'CONFIRM' to proceed: ");
        if (confirm.trim() !== 'CONFIRM') {
            console.log('\n❌ Operation cancelled by user');
            process.exit(0);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🚀 Starting ${dryRun ? 'DRY RUN' : 'LIVE'} process...`);
    console.log('='.repeat(60) + '\n');
    
    const updater = new StudentReviewUpdater(
        EXCEL_FILE_PATH, 
        API_BASE_URL, 
        AUTH_TOKEN, 
        dryRun
    );
    
    await updater.processAllSheets();
    updater.generateReport();
    
    console.log('\n✅ Process complete!\n');
}

if (require.main === module) {
    main().catch(err => {
        console.error('\n💥 Fatal error:', err);
        console.error(err.stack);
        process.exit(1);
    });
}

module.exports = StudentReviewUpdater;
