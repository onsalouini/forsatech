const nodemailer = require('nodemailer')

let cachedTransporter = null

function getRequiredEnv(name) {
	const value = process.env[name]
	if (!value || !String(value).trim()) return null
	return String(value).trim()
}

function getMailerTransporter() {
	if (cachedTransporter) return cachedTransporter

	const host = getRequiredEnv('SMTP_HOST')
	const port = Number(getRequiredEnv('SMTP_PORT') || 587)
	const user = getRequiredEnv('SMTP_USER')
	const pass = getRequiredEnv('SMTP_PASS')

	if (!host || !user || !pass) {
		return null
	}

	cachedTransporter = nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass },
	})

	return cachedTransporter
}

function getFromAddress() {
	const explicitFrom = getRequiredEnv('MAIL_FROM')
	if (explicitFrom) return explicitFrom

	const smtpUser = getRequiredEnv('SMTP_USER')
	if (smtpUser && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpUser)) {
		return `AIR <${smtpUser}>`
	}

	return 'AIR <no-reply@example.com>'
}

module.exports = {
	getMailerTransporter,
	getFromAddress,
}
