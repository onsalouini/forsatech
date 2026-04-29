const { getMailerTransporter, getFromAddress } = require('../utils/mailer')

async function test() {
  const transporter = getMailerTransporter()
  if (!transporter) { console.log('NO TRANSPORTER — check .env'); return }
  
  try {
    await transporter.verify()
    console.log('SMTP connection OK')
    
    const result = await transporter.sendMail({
      from: getFromAddress(),
      to: 'onsalouini5@gmail.com', // send to yourself
      subject: 'Test ForsaTech mailer',
      text: 'If you see this, mailer works.',
    })
    console.log('Sent:', result.messageId)
  } catch (err) {
    console.error('SMTP ERROR:', err.message)
  }
}

test()