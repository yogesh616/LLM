const express = require('express');
const cors = require('cors');
const { HfInference } = require('@huggingface/inference');

const app = express();
const port = process.env.PORT || 3000;
const hf = new HfInference(process.env.HF_API_KEY);

app.use(express.json());
app.use(cors({
    origin: '*'
}));

app.get('/api', async (req, res) => {
    const user = req.query.user;

    if (!user) {
        return res.status(400).json({ error: 'User parameter is required' });
    }

    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        let out = "";
        console.log(user)
        for await (const chunk of hf.chatCompletionStream({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            messages: [
                { role: "user", content: user },
            ],
            max_tokens: 500,
            temperature: 0.1,
            seed: 0,
        })) {
            if (chunk.choices && chunk.choices.length > 0) {
                out += chunk.choices[0].delta.content;
                res.write(`data: ${JSON.stringify({ result: out })}\n\n`);
            }
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
        console.log('done')
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred', details: err.message });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
