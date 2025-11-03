#!/usr/bin/env node
/**
 * Student Review Updater - BTech Review 1 Only (4 Components)
 * Processes ONLY Review 1 (panelReview1) marks with NEW 4-component structure
 * Uses PUT /api/student/:regNo endpoint
 * 
 * New Components:
 * 1. Knowledge on Research Domain/Problem statement (5 marks)
 * 2. Literature Review (15 Latest Papers - from Reputed Journals/Conferences) (5 marks)
 * 3. Design of the proposed methodology (5 marks)
 * 4. Implementation (5 marks)
 * 
 * Modes:
 * 1. DRY RUN - Preview only, no database changes
 * 2. TEST MODE - Updates ONLY the first student (for testing)
 * 3. LIVE MODE - Updates ALL students
 */

const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// Configuration
const EXCEL_FILE_PATH = '/home/administrator/Desktop/excel-files/StudentManagement_Review1_4Components.xlsx';
const API_BASE_URL = 'http://localhost:5000/api/student';
const AUTH_TOKEN = 
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Zjg5N2JlMjJiN2QwODQ3NDRmNjU0OCIsImVtYWlsSWQiOiJhZG1pbkB2aXQuYWMuaW4iLCJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjIxNzk0OTksImV4cCI6MTc2MjI2NTg5OX0.8E756qY0VRLeWuxrpfb4-gXeyz_jAa_8Lhbsp7Rs8bM"
class StudentReviewUpdater {
    constructor(excelFilePath, apiBaseUrl, authToken, mode = 'dry') {
        this.excelFilePath = excelFilePath;
        this.apiBaseUrl = apiBaseUrl;
        this.authToken = authToken;
        this.mode = mode; // 'dry', 'test', or 'live'

        // ✅ NEW: 4 components based on updated Excel structure
        this.review1Config = {
            reviewName: 'panelReview1',
            excelPrefix: 'Review 1',
            components: [
                'Knowledge on Research Domain/Problem statement',
                'Literature Review (15 Latest Papers – Minimum - from Reputed Journals/ Conferences)',
                'Design of the proposed methodology',
                'Implementation'
            ]
        };

        this.failedUpdates = [];
        this.successfulUpdates = [];
        this.totalStudentsProcessed = 0;
        this.logFile = `update_log_${this.mode}_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
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

    extractComponentMarks(row, reviewConfig) {
        const componentMarks = {};
        const prefix = reviewConfig.excelPrefix;

        for (const componentName of reviewConfig.components) {
            const colName = `${prefix}_${componentName}`;
            const value = row[colName];

            if (value !== undefined && value !== null && value !== '') {
                const mark = parseFloat(value);
                if (!isNaN(mark)) {
                    componentMarks[componentName] = mark;
                } else {
                    this.log(`  ⚠️  Invalid mark for ${componentName}: "${value}"`, 'WARN');
                }
            } else {
                this.log(`  ⚠️  Missing mark for ${componentName}`, 'WARN');
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

        this.log(`\nProcessing: ${studentName} (${regNo})`);

        // Extract PAT status
        const patDetected = String(row['PAT_Detected'] || '').toLowerCase() === 'yes';
        this.log(`  PAT Detected: ${patDetected ? 'YES' : 'NO'}`);

        const config = this.review1Config;
        const prefix = config.excelPrefix;

        // Extract component marks
        const componentMarks = this.extractComponentMarks(row, config);
        const marksCount = Object.keys(componentMarks).length;
        const totalMarks = Object.values(componentMarks).reduce((a, b) => a + b, 0);

        this.log(`  Components with marks: ${marksCount}/${config.components.length}`);
        this.log(`  Total marks: ${totalMarks}`);
        
        // Log individual component marks
        for (const [comp, mark] of Object.entries(componentMarks)) {
            const shortName = comp.substring(0, 40);
            this.log(`    - ${shortName}: ${mark}`);
        }

        // Extract attendance
        const attendanceValue = String(row[`${prefix}_Attendance`] || '').toLowerCase();
        const attendancePresent = attendanceValue === 'present';
        this.log(`  Attendance: ${attendancePresent ? 'Present' : 'Absent'} (raw: "${attendanceValue}")`);

        // Extract PPT Approval
        const pptApprovalValue = String(row[`${prefix}_PPT_Approved`] || '').toLowerCase();
        const pptApproved = pptApprovalValue === 'yes';
        this.log(`  PPT Approved: ${pptApproved ? 'YES' : 'NO'} (raw: "${pptApprovalValue}")`);

        // Extract comments
        const comments = String(row[`${prefix}_Comments`] || '').trim();
        if (comments) {
            this.log(`  Comments: ${comments.substring(0, 80)}${comments.length > 80 ? '...' : ''}`);
        }

        // Build review data object
        const reviewData = {
            reviewName: config.reviewName,
            marks: componentMarks,
            comments: comments,
            attendance: { 
                value: attendancePresent, 
                locked: false 
            },
            locked: false,
            pptApproved: pptApproved  // ✅ Always include for Review 1
        };

        const marksUpdate = [reviewData];

        return {
            regNo,
            name: studentName,
            payload: { 
                marksUpdate, 
                PAT: patDetected 
            }
        };
    }

    async sendStudentUpdate(regNo, payload) {
        if (this.mode === 'dry') {
            this.log(`[DRY RUN] Would send PUT request for: ${regNo}`);
            this.log(`[DRY RUN] Payload: ${JSON.stringify(payload, null, 2)}`);
            return { success: true, isDryRun: true };
        }

        try {
            const url = `${this.apiBaseUrl}/${regNo}`;
            this.log(`Sending PUT ${url}`);
            this.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

            const response = await axios.put(url, payload, {
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${this.authToken}` 
                },
                timeout: 30000
            });

            this.log(`Response: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}`);
            return { success: true, data: response.data };

        } catch (error) {
            const errorMsg = error.response
                ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 300)}`
                : `Request failed: ${error.message}`;
            
            this.log(`Error: ${errorMsg}`, 'ERROR');
            return { success: false, error: errorMsg };
        }
    }

    async processSheet(sheetName, data) {
        this.log(`\n${'='.repeat(70)}`);
        this.log(`Processing sheet: ${sheetName}`);
        
        // ✅ TEST MODE: Process only first student
        const studentsToProcess = this.mode === 'test' ? 1 : data.length;
        this.log(`Total students in sheet: ${data.length}`);
        this.log(`Students to process (${this.mode.toUpperCase()} mode): ${studentsToProcess}`);
        this.log('='.repeat(70));

        let processedCount = 0;

        for (let i = 0; i < studentsToProcess; i++) {
            const row = data[i];
            
            try {
                this.log(`\n--- Student ${i + 1}/${studentsToProcess} ---`);
                
                const studentData = this.processStudentRow(row);
                if (!studentData) continue;

                const { regNo, name, payload } = studentData;
                const result = await this.sendStudentUpdate(regNo, payload);

                if (result.success) {
                    this.successfulUpdates.push({ 
                        sheet: sheetName, 
                        reg_no: regNo, 
                        name,
                        review: 'panelReview1',
                        isDryRun: result.isDryRun || false
                    });
                    
                    if (this.mode === 'dry') {
                        this.log(`✅ DRY RUN: Would update ${name} (${regNo})`);
                    } else {
                        this.log(`✅ SUCCESS: Updated ${name} (${regNo})`);
                    }
                    processedCount++;
                } else {
                    this.failedUpdates.push({ 
                        sheet: sheetName, 
                        reg_no: regNo, 
                        name, 
                        error: result.error 
                    });
                    this.log(`❌ FAILED: ${name} (${regNo})`, 'ERROR');
                }

                // Rate limiting - wait 100ms between requests (not for dry run)
                if (this.mode !== 'dry') {
                    await new Promise(r => setTimeout(r, 100));
                }

            } catch (error) {
                this.log(`Error processing row ${i + 1}: ${error.message}`, 'ERROR');
            }
        }

        this.log(`\nSheet processing complete: ${processedCount}/${studentsToProcess} successful`);
        return processedCount;
    }

    async processAllSheets() {
        if (!this.loadExcelData()) return false;

        this.totalStudentsProcessed = 0;
        
        for (const [sheetName, data] of Object.entries(this.sheetData)) {
            const count = await this.processSheet(sheetName, data);
            this.totalStudentsProcessed += count;
        }

        this.log(`\n${'='.repeat(70)}`);
        this.log(`ALL SHEETS PROCESSED`);
        this.log(`Total students: ${this.totalStudentsProcessed}`);
        this.log(`Successful: ${this.successfulUpdates.length}`);
        this.log(`Failed: ${this.failedUpdates.length}`);
        this.log('='.repeat(70));

        return true;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            mode: this.mode.toUpperCase(),
            review_processed: 'Review 1 (panelReview1) only - 4 Components',
            components: this.review1Config.components,
            summary: {
                total_students_processed: this.totalStudentsProcessed,
                total_successful: this.successfulUpdates.length,
                total_failed: this.failedUpdates.length,
                success_rate: this.totalStudentsProcessed > 0 
                    ? ((this.successfulUpdates.length / this.totalStudentsProcessed) * 100).toFixed(2) + '%'
                    : '0%'
            },
            successful_updates: this.successfulUpdates,
            failed_updates: this.failedUpdates
        };

        const reportFilename = `update_report_${this.mode}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
        this.log(`\n📄 Full report saved: ${reportFilename}`);

        // Console summary
        console.log('\n' + '='.repeat(70));
        console.log('=== FINAL SUMMARY ===');
        console.log('='.repeat(70));
        console.log(`Review Processed: Review 1 (panelReview1) - 4 Components`);
        console.log(`Components:`);
        this.review1Config.components.forEach((comp, i) => {
            const shortComp = comp.length > 50 ? comp.substring(0, 50) + '...' : comp;
            console.log(`  ${i + 1}. ${shortComp}`);
        });
        console.log(`Mode: ${this.mode.toUpperCase()}`);
        console.log(`Total Students: ${report.summary.total_students_processed}`);
        console.log(`✅ Successful: ${report.summary.total_successful}`);
        console.log(`❌ Failed: ${report.summary.total_failed}`);
        console.log(`Success Rate: ${report.summary.success_rate}`);

        if (this.mode === 'test') {
            console.log('\n' + '='.repeat(70));
            console.log('=== TEST MODE - FIRST STUDENT PROCESSED ===');
            console.log('='.repeat(70));
            if (this.successfulUpdates.length > 0) {
                const student = this.successfulUpdates[0];
                console.log(`Student: ${student.name} (${student.reg_no})`);
                console.log(`Sheet: ${student.sheet}`);
                console.log(`Status: Successfully updated`);
            }
        }

        if (this.failedUpdates.length > 0) {
            console.log('\n' + '='.repeat(70));
            console.log('=== FAILED UPDATES (First 10) ===');
            console.log('='.repeat(70));
            this.failedUpdates.slice(0, 10).forEach(({ name, reg_no, error }, i) => {
                console.log(`\n${i + 1}. ${name} (${reg_no})`);
                console.log(`   Error: ${error}`);
            });
            if (this.failedUpdates.length > 10) {
                console.log(`\n... +${this.failedUpdates.length - 10} more failures (see JSON report)`);
            }
        }

        console.log('\n' + '='.repeat(70));
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
    console.log('\n' + '='.repeat(70));
    console.log('=== Student Review Updater - Review 1 (4 Components) ===');
    console.log('='.repeat(70));
    
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.error(`\n❌ Excel file not found: ${EXCEL_FILE_PATH}`);
        process.exit(1);
    }

    console.log(`\n📄 Excel File: ${EXCEL_FILE_PATH}`);
    console.log(`🌐 API Endpoint: ${API_BASE_URL}/:regNo`);
    console.log(`📋 Review: panelReview1 (Review 1) - 4 Components`);
    console.log(`\nComponents:`);
    console.log(`  1. Knowledge on Research Domain/Problem statement (5 marks)`);
    console.log(`  2. Literature Review (15 Latest Papers) (5 marks)`);
    console.log(`  3. Design of the proposed methodology (5 marks)`);
    console.log(`  4. Implementation (5 marks)`);
    console.log(`🔐 Auth Token: ${AUTH_TOKEN.substring(0, 30)}...`);
    
    console.log('\n' + '='.repeat(70));
    console.log('SELECT MODE:');
    console.log('='.repeat(70));
    console.log('1. DRY RUN - Preview only, no database changes');
    console.log('2. TEST MODE - Update ONLY the first student (22BAI1158 - SUNEETH S)');
    console.log('3. LIVE MODE - Update ALL 1715 students in the sheet');
    
    const modeInput = await askQuestion('\nEnter mode (1, 2, or 3): ');
    const modeNum = modeInput.trim();
    
    let mode;
    let modeDescription;
    
    switch (modeNum) {
        case '1':
            mode = 'dry';
            modeDescription = 'DRY RUN';
            break;
        case '2':
            mode = 'test';
            modeDescription = 'TEST MODE (1 student)';
            break;
        case '3':
            mode = 'live';
            modeDescription = 'LIVE MODE (all students)';
            break;
        default:
            console.log('\n❌ Invalid mode selected. Exiting.');
            process.exit(1);
    }
    
    // Confirmation for TEST and LIVE modes
    if (mode === 'test' || mode === 'live') {
        console.log('\n' + '='.repeat(70));
        console.log(`⚠️  WARNING: ${modeDescription} - DATABASE WILL BE UPDATED!`);
        console.log('='.repeat(70));
        
        if (mode === 'test') {
            console.log('This will update Review 1 (4 components) for the FIRST student only:');
            console.log('  Register No: 22BAI1158');
            console.log('  Name: SUNEETH S');
            console.log('  Marks: 4.5, 3.0, 3.5, 2.5 (Total: 13.5)');
        } else {
            console.log('This will update Review 1 (4 components) for ALL 1715 BTech students.');
        }
        
        const confirm = await askQuestion("\nType 'CONFIRM' to proceed: ");
        if (confirm.trim() !== 'CONFIRM') {
            console.log('\n❌ Operation cancelled by user');
            process.exit(0);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`🚀 Starting ${modeDescription} process...`);
    console.log('='.repeat(70));
    
    const startTime = Date.now();
    
    const updater = new StudentReviewUpdater(
        EXCEL_FILE_PATH, 
        API_BASE_URL, 
        AUTH_TOKEN, 
        mode
    );
    
    await updater.processAllSheets();
    const report = updater.generateReport();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Total time: ${duration} seconds`);
    console.log(`📄 Log file: ${updater.logFile}`);
    
    if (mode === 'test' && report.summary.total_successful > 0) {
        console.log('\n' + '='.repeat(70));
        console.log('✅ TEST MODE SUCCESS!');
        console.log('='.repeat(70));
        console.log('The first student was successfully updated with 4 components.');
        console.log('Please verify the data in your database before running LIVE MODE.');
        console.log('\nTo update all students, run this script again and select option 3.');
    }
    
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
