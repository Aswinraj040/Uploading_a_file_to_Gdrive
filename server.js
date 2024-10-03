const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

//Uncomment the below cred and add your credentials please
/*
const cred = {
  "type": "",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "",
  "token_uri": "",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": "",
  "universe_domain": ""
};*/

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
    credentials: cred,
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
