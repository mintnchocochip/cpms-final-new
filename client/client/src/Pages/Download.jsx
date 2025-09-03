import React from 'react';
import { CSVLink } from 'react-csv';
import { Download } from 'lucide-react';
import Navbar from "../Components/Navbar";

const DownloadComponent = ({ data1, data2 }) => {
    const prepareCSVData = () => {
        const headers = [];
        if (data1 && data1.length > 0) {
            Object.keys(data1[0]).forEach(key => {
                headers.push({ label: `Data1_${key}`, key: `data1_${key}` });
            });
        }
        if (data2 && data2.length > 0) {
            Object.keys(data2[0]).forEach(key => {
                headers.push({ label: `Data2_${key}`, key: `data2_${key}` });
            });
        }

        const maxLength = Math.max(
            data1 ? data1.length : 0,
            data2 ? data2.length : 0
        );

        const rows = [];
        for (let i = 0; i < maxLength; i++) {
            const row = {};
            if (data1 && i < data1.length) {
                Object.keys(data1[i]).forEach(key => {
                    row[`data1_${key}`] = data1[i][key];
                });
            }
            if (data2 && i < data2.length) {
                Object.keys(data2[i]).forEach(key => {
                    row[`data2_${key}`] = data2[i][key];
                });
            }
            rows.push(row);
        }

        return { headers, data: rows };
    };

    const prepareHorizontalCSVData = () => {
        const data = [];
        if (data1 && data1.length > 0) {
            data1.forEach((item, index) => {
                if (!data[index]) data[index] = {};
                Object.keys(item).forEach(key => {
                    data[index][`Data1_${key}`] = item[key];
                });
            });
        }
        if (data2 && data2.length > 0) {
            data2.forEach((item, index) => {
                if (!data[index]) data[index] = {};
                Object.keys(item).forEach(key => {
                    data[index][`Data2_${key}`] = item[key];
                });
            });
        }
        return data;
    };

    const csvData = prepareHorizontalCSVData();
    const filename = `data_export_${new Date().toISOString().slice(0, 10)}.csv`;

    return (
        <>
            <Navbar />
            <div className="pt-20 px-4">
                <h1 className="font-semibold pt-5 font-roboto text-3xl text-center">
                    Download All
                </h1>
            </div>
            <div className="flex justify-center mt-6 px-4">
                <CSVLink
                    data={csvData}
                    filename={filename}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors w-full sm:w-auto justify-center"
                    onClick={() => {
                        console.log("CSV download initiated");
                    }}
                >
                    <Download size={18} />
                    <span className="text-sm sm:text-base">Download as CSV</span>
                </CSVLink>
            </div>
        </>
    );
};

export default DownloadComponent;
