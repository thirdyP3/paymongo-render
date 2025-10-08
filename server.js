// server.js
import 'dotenv/config';        // loads .env into process.env
import express from 'express';
import cors from 'cors';

const app = express();

// NOTE: for production restrict origins: cors({ origin: 'https://your-systeme-url' })
app.use(cors());
app.use(express.json());

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET;
const SUCCESS_URL = process.env.SUCCESS_URL;
const FAILED_URL = process.env.FAILED_URL;

if (!PAYMONGO_SECRET) {
  console.error('Missing PAYMONGO_SECRET in environment. Exiting.');
  process.exit(1);
}

app.post('/create-paymongo-link', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'Missing amount' });

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${PAYMONGO_SECRET}:`).toString('base64'),
      },
      body: JSON.stringify({
        data: {
          attributes: {
			line_items: [
				{
					name: 'P3 Subscription',
					quantity: 1,
					amount: Number(amount) * 100,
					currency: 'PHP'
				}
			],
			payment_method_types: ['gcash', 'grab_pay','paymaya','qrph','dob'],
			success_url: SUCCESS_URL,
			cancel_url: FAILED_URL,
			failed_url: FAILED_URL
          },
        },
      }),
    });

    const data = await response.json();

    if (data.errors) return res.status(400).json({ error: data.errors });

    return res.json({ url: data.data.attributes.checkout_url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


