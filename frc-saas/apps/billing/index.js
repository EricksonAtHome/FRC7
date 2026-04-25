import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_KEY || "sk_test_mock");

export async function createSubscription(customerId) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: "price_frc_pro" }]
  });
}
