const { EmailClient } = require("@azure/communication-email");

module.exports = async function (context, req) {
  const connectionString = process.env.ACS_CONNECTION_STRING;
  const senderAddress = process.env.ACS_SENDER_ADDRESS; // e.g. DoNotReply@xxxxx.azurecomm.net

  if (!connectionString || !senderAddress) {
    context.log.error("Missing ACS_CONNECTION_STRING or ACS_SENDER_ADDRESS app settings.");
    context.res = { status: 500, body: { success: false, error: "Email service not configured." } };
    return;
  }

  const { Name, Company, Email, Phone, Country, Message } = req.body || {};

  if (!Name || !String(Name).trim()) {
    context.res = { status: 400, body: { success: false, error: "Name is required." } };
    return;
  }
  if (!Email || !String(Email).trim()) {
    context.res = { status: 400, body: { success: false, error: "Email is required." } };
    return;
  }

  try {
    const client = new EmailClient(connectionString);
    const message = {
      senderAddress: senderAddress,
      content: {
        subject: `Catalogue enquiry — ${Name}`,
        plainText:
          `Name: ${Name}\n` +
          `Company: ${Company || "—"}\n` +
          `Email: ${Email}\n` +
          `Phone: ${Phone || "—"}\n` +
          `Country: ${Country || "—"}\n\n` +
          `Message:\n${Message || "—"}`
      },
      recipients: {
        to: [{ address: "contact@ivlori.com" }]
      },
      replyTo: [{ address: Email, displayName: Name }]
    };

    const poller = await client.beginSend(message);
    await poller.pollUntilDone();

    context.res = { status: 200, body: { success: true } };
  } catch (err) {
    context.log.error("Email send failed:", err);
    context.res = { status: 500, body: { success: false, error: "Send failed." } };
  }
};
