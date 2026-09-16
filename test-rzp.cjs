const Razorpay = require('razorpay');
const rzp = new Razorpay({ key_id: 'rzp_live_Tcn0IlOcwCPgU3', key_secret: 'WjsuQXaoCGqxMo0HKTzc7tCI' });
rzp.orders.create({ amount: 100, currency: 'INR', receipt: 'receipt#1' }).catch(e => console.log(e));
