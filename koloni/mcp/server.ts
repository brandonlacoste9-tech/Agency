import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('MCP Server running on http://localhost:3001');
});

// Mock endpoint for campaign video generation
app.post('/generate', (req, res) => {
    res.json({
        status: 'success',
        message: 'Mock video generated',
        videoUrl: 'https://example.com/mock-video.mp4'
    });
});

app.listen(PORT, () => {
    console.log(`MCP Server running on http://localhost:${PORT}`);
});
