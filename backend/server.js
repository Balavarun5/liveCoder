const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS with specific options
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], // Allow multiple origins
  methods: ['GET', 'POST', 'OPTIONS'], // Allow both GET and POST
  credentials: true
}));

// Increase payload limit
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../tester/images');
try {
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Images directory created successfully at:', imagesDir);
  }
} catch (error) {
  console.error('Error creating images directory:', error);
}

// Add endpoint to write file contents
app.post('/api/write-file', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    
    if (!filePath || !content) {
      throw new Error('File path and content are required');
    }

    // Ensure the path is within the project directory
    const absolutePath = path.join(__dirname, '..', filePath);
    
    // Write the file
    await fs.promises.writeFile(absolutePath, content, 'utf8');
    console.log('File written successfully:', absolutePath);
    
    res.json({ 
      success: true, 
      message: 'File updated successfully'
    });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to write file: ${error.message}`
    });
  }
});

app.post('/api/save-screenshot', async (req, res) => {
  try {
    console.log('Received screenshot request');
    
    if (!req.body.imageData) {
      throw new Error('No image data received');
    }

    const { imageData } = req.body;
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    
    if (!base64Data) {
      throw new Error('Invalid image data format');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `code-toggle-${timestamp}.png`;
    const filePath = path.join(imagesDir, filename);

    // Use async file writing
    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
    console.log('Screenshot saved successfully to:', filePath);
    
    res.json({ 
      success: true, 
      message: 'Screenshot saved successfully',
      filename: filename,
      path: filePath
    });
  } catch (error) {
    console.error('Detailed error saving screenshot:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to save screenshot: ${error.message}`,
      error: error.toString()
    });
  }
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'Backend server is running' });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`Images will be saved to: ${imagesDir}`);
  console.log('CORS enabled for origins:', ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']);
}); 