import pandas as pd

# Creating data for the Excel sheet
data = {
    'School': ['SCOPE', 'SENSE'],
    'Department': ['BTech', 'MCA'],
    'Specialization': ['AI/ML', 'Web Development'],
    'Student Name 1': ['John Doe', 'Alice Brown'],
    'Student RegNo 1': ['21BCE1001', '21MCA2001'],
    'Student Email 1': ['john.doe@vitstudent.ac.in', 'alice.brown@vitstudent.ac.in'],
    'Student Name 2': ['Jane Smith', 'Bob Wilson'],
    'Student RegNo 2': ['21BCE1002', '21MCA2002'],
    'Student Email 2': ['jane.smith@vitstudent.ac.in', 'bob.wilson@vitstudent.ac.in'],
    'Student Name 3': ['Mike Johnson', ''],
    'Student RegNo 3': ['21BCE1003', ''],
    'Student Email 3': ['mike.johnson@vitstudent.ac.in', '']
}

# Convert to DataFrame
df = pd.DataFrame(data)

# Save to Excel file
df.to_excel("students_data.xlsx", index=False)

print("Excel file 'students_data.xlsx' created successfully!")
