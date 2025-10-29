#!/usr/bin/env node
/**
 * Student Review Updater - Node.js Version
 * Uses individual PUT /:regNo endpoint for each student
 * Processes ALL students with component-level marks
 */

const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const EXCEL_FILE_PATH = '/home/administrator/Desktop/excel-files/Upload/student_mark_assign.xlsx';
const API_BASE_URL = 'http://localhost:5000/api/student'; // Base URL for student endpoint
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Zjg5N2JlMjJiN2QwODQ3NDRmNjU0OCIsImVtYWlsSWQiOiJhZG1pbkB2aXQuYWMuaW4iLCJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjE2NzcwOTMsImV4cCI6MTc2MTc2MzQ5M30.8gftdd6WoUdWw0l8Gho61KDzqlI7hQJQ4rOZ5o6mZGc';

class StudentReviewUpdater {
    constructor(excelFilePath, apiBaseUrl, authToken, dryRun = false) {
        this.excelFilePath = excelFilePath;
        this.apiBaseUrl = apiBaseUrl;
        this.authToken = authToken;
        this.dryRun = dryRun;

        // Exact component mapping matching Excel columns
        this.componentMapping = {
            'MCA': {
                'draftReview': {
                    excelPrefix: 'Zero-th Review',
                    components: ['Problem Formulation'],
                    isDummy: true
                },
                'guideReview1': {
                    excelPrefix: 'Review 1',
                    components: ['Literature Review & Design of Methodology'],
                    isDummy: true
                },
                'guideReview2': {
                    excelPrefix: 'Dummy',
                    components: ['test'],
                    isDummy: true
                },
                'review0': {
                    excelPrefix: 'Review 2',
                    components: [
                        'Proposed Model / Architecture / Framework Designed',
                        'Modules Description',
                        'Detailed design with Explanations (Algorithms)',
                        'Partial Implementation (60%)/Dataset description / Results Obtained',
                        'Presentation & Ability to Answer questions'
                    ],
                    isDummy: false
                }
            },
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
            },
            'M.Tech 2yr (MCS,MCB,MAI)': {
                'draftReview': {
                    excelPrefix: 'Dummy',
                    components: ['test'],
                    isDummy: true
                },
                'panelReview1': {
                    excelPrefix: '2nd Review',
                    components: [
                        'Explanation of all the modules one by one which includes the algorithm(s)',
                        '70% implementation with results',
                        'Presentation skill and ability to answer questions'
                    ],
                    isDummy: false
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

            this.log('\n🔍 Detected sheet names:');
            workbook.SheetNames.forEach((name, i) => {
                this.log(`  ${i + 1}. "${name}"`);
            });

            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                this.sheetData[sheetName] = jsonData;
                this.log(`✅ Loaded sheet '${sheetName}' with ${jsonData.length} students`);
            }

            return true;
        } catch (error) {
            this.log(`❌ Failed to load Excel file: ${error.message}`, 'ERROR');
            return false;
        }
    }

    getDepartmentFromSheetName(sheetName) {
        if (sheetName.includes('MCA')) return 'MCA';
        if (sheetName.includes('BTech')) return 'BTech';
        if (sheetName.includes('M.Tech')) return 'M.Tech 2yr (MCS,MCB,MAI)';
        return null;
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

    getDepartmentForRow(row, sheetName) {
        if (sheetName.includes('M.Tech') && row['Department']) {
            const deptVal = String(row['Department']).trim();
            if (deptVal && deptVal !== 'undefined') {
                return deptVal;
            }
        }

        return this.getDepartmentFromSheetName(sheetName);
    }

    processStudentRow(row, department) {
        try {
            const regNo = String(row['Register No'] || '').trim();
            const studentName = String(row['Name'] || '').trim();

            if (!regNo || regNo === 'undefined' || regNo === '') {
                this.log(`⚠️  Skipping row: No valid registration number`, 'WARN');
                return null;
            }

            this.log(`📝 Processing: ${studentName} (${regNo}) - Dept: ${department}`);

            // Get PAT status
            const patDetected = row['PAT_Detected'] &&
                String(row['PAT_Detected']).toLowerCase() === 'yes';

            const deptMapping = this.componentMapping[department];
            if (!deptMapping) {
                this.log(`❌ No mapping found for department: ${department}`, 'ERROR');
                return null;
            }

            // Build marksUpdate array for the API
            const marksUpdate = [];

            for (const [reviewName, reviewConfig] of Object.entries(deptMapping)) {
                if (reviewConfig.isDummy) {
                    this.log(`⏭️  Skipping dummy review: ${reviewName}`, 'DEBUG');
                    this.totalReviewsSkipped++;
                    continue;
                }

                const excelPrefix = reviewConfig.excelPrefix;
                const componentMarks = this.extractComponentMarks(row, reviewConfig, excelPrefix);

                const commentsCol = `${excelPrefix}_Comments`;
                const attendanceCol = `${excelPrefix}_Attendance`;

                const comments = row[commentsCol] ? String(row[commentsCol]).trim() : '';
                const attendancePresent = row[attendanceCol] &&
                    String(row[attendanceCol]).toLowerCase() === 'present';

                // Add to marksUpdate array in the format expected by your API
                marksUpdate.push({
                    reviewName: reviewName,
                    marks: componentMarks,
                    comments: comments,
                    attendance: {
                        value: attendancePresent,
                        locked: false
                    },
                    locked: false
                });

                const marksSum = Object.values(componentMarks).reduce((a, b) => a + b, 0);
                const status = attendancePresent ? 'Present' : 'Absent';
                const compCount = Object.keys(componentMarks).length;
                this.log(`  ✓ ${reviewName}: ${compCount} components, Marks: ${marksSum}, Status: ${status}`);
            }

            // Return payload in the format your API expects
            return {
                regNo: regNo,
                name: studentName,
                payload: {
                    marksUpdate: marksUpdate,
                    PAT: patDetected
                }
            };
        } catch (error) {
            this.log(`❌ Error processing student: ${error.message}`, 'ERROR');
            return null;
        }
    }

    async sendStudentUpdate(regNo, payload) {
        if (this.dryRun) {
            this.log(`[DRY RUN] Would update student: ${regNo}`);
            return { success: true, data: { message: 'Dry run - no actual API call' } };
        }

        try {
            const url = `${this.apiBaseUrl}/${regNo}`;
            this.log(`🌐 PUT ${url}`);

            const response = await axios.put(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                timeout: 30000
            });

            return { success: true, data: response.data };
        } catch (error) {
            const errorMsg = error.response
                ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).substring(0, 200)}`
                : `Request failed: ${error.message}`;
            return { success: false, error: errorMsg };
        }
    }

    async processSheet(sheetName, data) {
        const baseDepartment = this.getDepartmentFromSheetName(sheetName);

        if (!baseDepartment) {
            this.log(`⚠️  Unknown sheet: ${sheetName}, skipping`, 'WARN');
            return 0;
        }

        this.log(`\n${'='.repeat(80)}`);
        this.log(`📋 Processing Sheet: ${sheetName}`);
        this.log(`🏫 Base Department: ${baseDepartment}`);
        this.log(`👥 Total Students: ${data.length}`);
        this.log('='.repeat(80));

        let processedCount = 0;

        for (const row of data) {
            try {
                const department = this.getDepartmentForRow(row, sheetName) || baseDepartment;
                const studentData = this.processStudentRow(row, department);

                if (studentData) {
                    const { regNo, name, payload } = studentData;

                    // Send individual update request
                    const result = await this.sendStudentUpdate(regNo, payload);

                    if (result.success) {
                        this.log(`✅ Successfully updated: ${name} (${regNo})`);
                        this.successfulUpdates.push({
                            sheet: sheetName,
                            reg_no: regNo,
                            name: name,
                            reviews_count: payload.marksUpdate.length
                        });
                        processedCount++;
                    } else {
                        this.log(`❌ Failed to update ${name} (${regNo}): ${result.error}`, 'ERROR');
                        this.failedUpdates.push({
                            sheet: sheetName,
                            reg_no: regNo,
                            name: name,
                            error: result.error
                        });
                    }

                    // Small delay to avoid overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                const regNo = row['Register No'] || 'Unknown';
                const name = row['Name'] || 'Unknown';
                const errorMsg = `Failed to process ${name} (${regNo}): ${error.message}`;
                this.log(`❌ ${errorMsg}`, 'ERROR');
                this.failedUpdates.push({
                    sheet: sheetName,
                    reg_no: regNo,
                    name: name,
                    error: error.message
                });
            }
        }

        this.log(`✅ Sheet '${sheetName}' complete: ${processedCount} students processed`);
        return processedCount;
    }

    async processAllSheets() {
        if (!this.loadExcelData()) {
            return false;
        }

        this.totalStudentsProcessed = 0;

        for (const [sheetName, data] of Object.entries(this.sheetData)) {
            const processed = await this.processSheet(sheetName, data);
            this.totalStudentsProcessed += processed;
        }

        this.log(`\n${'='.repeat(80)}`);
        this.log('🎉 ALL SHEETS PROCESSED');
        this.log('='.repeat(80));
        this.log(`✅ Total Students: ${this.totalStudentsProcessed}`);
        this.log(`✅ Successful: ${this.successfulUpdates.length}`);
        this.log(`❌ Failed: ${this.failedUpdates.length}`);
        this.log(`⏭️  Dummy Reviews Skipped: ${this.totalReviewsSkipped}`);

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

        console.log('\n' + '='.repeat(80));
        console.log('📊 FINAL SUMMARY');
        console.log('='.repeat(80));
        console.log(this.dryRun ? 'DRY RUN MODE' : 'LIVE MODE');
        console.log(`✅ Processed: ${report.summary.total_students_processed}`);
        console.log(`✅ Successful: ${report.summary.total_successful}`);
        console.log(`❌ Failed: ${report.summary.total_failed}`);
        console.log(`⏭️  Skipped: ${report.summary.total_reviews_skipped}`);

        if (this.failedUpdates.length > 0) {
            console.log('\n❌ FAILURES:');
            this.failedUpdates.slice(0, 10).forEach((f, i) => {
                console.log(`${i + 1}. ${f.name || 'N/A'} (${f.reg_no}): ${f.error}`);
            });
            if (this.failedUpdates.length > 10) {
                console.log(`... +${this.failedUpdates.length - 10} more`);
            }
        }

        console.log('='.repeat(80));
        console.log('✅ ALL STUDENTS PROCESSED');
        console.log('   • Includes students with zero marks (valid)');
        console.log('   • Includes absent students (valid)');
        console.log('   • Includes students with only comments (valid)');
        console.log('   • Only dummy/test reviews were skipped');
        console.log('='.repeat(80));

        return report;
    }
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer);
    }));
}

async function main() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 STUDENT REVIEW UPDATER - Individual PUT /:regNo');
    console.log('='.repeat(80));
    console.log('✓ Processes ALL students including absent and zero-mark cases');
    console.log('✓ Component-level marks extraction');
    console.log('✓ Only skips dummy/test reviews');
    console.log('✓ Uses PUT /api/student/:regNo endpoint');
    console.log('='.repeat(80));

    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.log(`\n❌ File not found: ${EXCEL_FILE_PATH}`);
        process.exit(1);
    }

    console.log(`\n📁 Excel: ${EXCEL_FILE_PATH}`);
    console.log(`🌐 API: ${API_BASE_URL}/:regNo`);
    console.log(`🔐 Auth: Bearer token configured`);
    console.log('\n1. DRY RUN (test)');
    console.log('2. LIVE MODE (update DB)');

    const mode = await askQuestion('\nSelect mode (1 or 2): ');
    const dryRun = mode.trim() === '1';

    if (dryRun) {
        console.log('\n🔍 Running in DRY RUN mode (no database changes)');
    } else {
        console.log('\n⚠️  Running in LIVE MODE (will update database)');
        const confirm = await askQuestion("\nType 'CONFIRM' to proceed: ");
        if (confirm.trim() !== 'CONFIRM') {
            console.log('❌ Operation cancelled');
            process.exit(0);
        }
    }

    const updater = new StudentReviewUpdater(EXCEL_FILE_PATH, API_BASE_URL, AUTH_TOKEN, dryRun);

    console.log('\n🔄 Starting update process...\n');
    await updater.processAllSheets();

    const report = updater.generateReport();

    console.log(`\n📄 Log file: ${updater.logFile}`);
    console.log('✅ Process complete!\n');
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = StudentReviewUpdater;
