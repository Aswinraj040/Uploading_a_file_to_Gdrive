const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

// Google Drive setup
const GOOGLE_CREDENTIALS = {
  "type": "service_account",
  "project_id": "rithostel",
  "private_key_id": "d1a072a1d08a9e0ab5da9a3ac9be7e7eea30247a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCdm8s9wM4TCmCK\nNLVOjQPDaZFsIKoTBkMTP0XC/KjcTJZw3TLgIsFpfyXJTKmiQZ5FHCKM9o7Pf1J8\n3ZxAKyCQ3VXzFUB3a//BpftO1KbeU0+1hinG6NVS2pKHRo9qOWHZ0g6igqCZr6dn\nL1PjgyL7KgLIrp7cFvhzYPx7rBy7q5hptRH2VB/7bW9zA8yo01VMJdi4Yy8oQaTY\nHCnsWOvf4nJBp+KndDoi+/inPHQdmkpSYSrkG3Y6yfckuWAl1fQ6vkH4BK/nFMYR\n3IsTUn3b4Z8KSWmLrTL5eoxOvyLn/tqPa6NHkI9rxLpCPLjY5IIFw0kRaakXPZUF\n0KjFxrPRAgMBAAECggEADBJAJUksn2m2ji9OSadkR+XAhRsVW6KppYI9mhsW5dSZ\n2ygd+uu+i5F49+t+vJYxBJMMlGZX9s2GKFki3AlRk7bYG+efSeZELvVDA70m0LVp\nz/noHjt8Bz4FZgYB+v1NIM1FYK4Hle3NsQn/b1f+aGVF1FAHi8zYl6GwhNpgUwFJ\nOdAXjcNYqpCrydZcv1M7Iz+DVfNEKT0EZPiWdzPXkalFEYJ6XTemEY3MBSJx2Xg/\nWRUNVOMojzpyFJUS8YCgMpKCxzqBfrx1YsGFiFjK4wGycxYLyEj/6jdX3xurjeDX\nTZ0Pjjwx4nXVQs0ed4tmCevo4y3RrKRNqcmensGXSQKBgQDTrrozdccvhavOHlPj\nq2qpN2qaHGM0aULVbTSyNQnEArjMEqeeRTIhSspk7MgOCW+t/RQWIREQ0gnMAt64\ncy0nYkw3aeqL6hyJMKIF7ks8f16IlaAtc2CP3PsrrY1Uxx6VWA6St1gyhV0e2/Xu\n7Jsf1IyAP2G8DXUWqfbkNNCtDQKBgQC+mu9gDWUpe9Vzm586euXuyp6ATPfw7Zns\nXH9NFv8/p9/w3EZf45Ig8X8/el+kYYe49BkdiYMKvCmmBJjcwrigNZ0lED4PN+dg\nL+cKxjNihbd30+5sqBUjRBy8o1wnQBgU8i//IaMTmoEFESLlU+b5AvvwXgS4aDZ8\nxesjb0OY1QKBgEGA+C2kbJbQDnIiAGObT849T8eQsUIusHfK61uZ/gOhs/2yaBwZ\n3YFf23GPs/hkAyMcBXMzmExUMqPm33TEb1yYlm0vYV0afOoXGowrSSzXXTF227I0\n2dSq1S6W7f0mANjF/vx3r9syWbaK6nec0APxiejFtEC1CV6SCcxka46hAoGAHzxc\nxizryySUEmIKchb532wtFXGHoGAPvYBbDFMceV4VgO9YSRaON//bjpeLXPDuwQyf\noQuMAhJb8O0H8AWpI/glTJGg2fWbYVP4VPeuLBMlwellRUE2VZUv8GoFDBmg2K3n\n17O3edr0EdSBF3vsehpXF0kRFPdfFouIwUHWnhECgYAjdHgBLRCZUFlT2xzMDyhs\n1mprgFe3BplqmqTtHhfGwyl4rcWuhJzQKOk30I3hIEUEQ/VcF3mlaqIOR+kqSt59\nwtZY/lTh90EWv8+giey/SJr3x2JhM0jqRwYK8ABOqDdwQ8eM8ev5VtYMsDsZY3rp\nOfOppNB7zNTDdGjzR/YRUA==\n-----END PRIVATE KEY-----\n",
  "client_email": "aswinsample@rithostel.iam.gserviceaccount.com",
  "client_id": "100287944718738357982",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/aswinsample%40rithostel.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Create uploads directory if not exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Initialize express
const app = express();

// Enable CORS for all routes
app.use(cors());

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Google Drive API client setup
const auth = new google.auth.GoogleAuth({
    credentials: GOOGLE_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive.file']
});
const driveService = google.drive({ version: 'v3', auth });

// Function to upload file to Google Drive
async function uploadFileToDrive(filePath, fileName) {
    const fileMetadata = {
        name: fileName
    };
    const media = {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(filePath)
    };
    
    const res = await driveService.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    });
    
    return res.data.id; // Return the file ID from Google Drive
}

// Function to set file permission to public
async function setFilePublic(fileId) {
    await driveService.permissions.create({
        fileId: fileId,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

    // Construct the public URL
    const publicUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;
    return publicUrl;
}

// Define /upload route to handle file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileName = req.file.filename;

        // Upload file to Google Drive
        const fileId = await uploadFileToDrive(filePath, fileName);

        // Set file to be publicly accessible and get the public URL
        const publicUrl = await setFilePublic(fileId);
        
        res.send({
            status: 'success',
            message: 'File uploaded successfully',
            filename: fileName,
            path: filePath,
            googleDriveFileId: fileId,
            publicUrl: publicUrl
        });
    } catch (err) {
      console.log(err);
        res.status(500).send({ status: 'error', message: err.message });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
