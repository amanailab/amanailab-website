import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ReceiptItem {
  title: string
  url: string
}

export interface ReceiptData {
  to: string
  customerName?: string
  itemTitle: string
  amountPaise: number      // 0 for member code free downloads
  paymentId?: string
  type: 'note' | 'package'
  via: 'payment' | 'member_code'
  items: ReceiptItem[]
}

export async function sendReceiptEmail(data: ReceiptData): Promise<void> {
  const from      = process.env.RESEND_FROM_EMAIL ?? 'AmanAI Lab <onboarding@resend.dev>'
  const firstName = data.customerName?.split(' ')[0] || 'there'
  const isMember  = data.via === 'member_code'
  const isBundle  = data.type === 'package'
  const amountRs  = Math.round(data.amountPaise / 100)
  const shortId   = data.paymentId
    ? (data.paymentId.length > 16 ? data.paymentId.slice(0, 16) + '…' : data.paymentId)
    : null

  const downloadLinks = data.items.map(item =>
    `<a href="${item.url}"
       style="display:block;background:#052e16;color:#86efac;font-size:14px;font-weight:600;
              text-decoration:none;padding:12px 16px;border-radius:10px;
              border:1px solid #14532d;margin-bottom:8px;">
      &#11015;&#xFE0F;&nbsp; ${item.title}
    </a>`
  ).join('')

  const orderSummaryRows = isMember
    ? `<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#f4f4f5">${data.itemTitle}</p>
       <p style="margin:0;font-size:13px;color:#71717a">${data.items.length} PDF${data.items.length !== 1 ? 's' : ''} &middot; <span style="color:#86efac">Free — YouTube Member</span></p>`
    : `<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#f4f4f5">${data.itemTitle}</p>
       <p style="margin:0;font-size:13px;color:#71717a">${data.items.length} PDF${data.items.length !== 1 ? 's' : ''} &middot; &#8377;${amountRs}${shortId ? ` &middot; ID: ${shortId}` : ''}</p>`

  const headline = isMember
    ? `Your member download is ready, ${firstName}!`
    : `Thanks for your purchase, ${firstName}!`

  const subtext = isMember
    ? `You accessed this ${isBundle ? 'bundle' : 'note'} using your YouTube member code. Download ${data.items.length > 1 ? 'all files' : 'it'} below — links are valid for <strong style="color:#f4f4f5">24 hours</strong>.`
    : `Your ${isBundle ? 'bundle is ready' : 'note is ready'}. Download ${data.items.length > 1 ? 'all files' : 'it'} below — links are valid for <strong style="color:#f4f4f5">24 hours</strong>.`

  const subject = isMember
    ? `Your AmanAI Lab member download — ${data.itemTitle}`
    : `Your AmanAI Lab ${isBundle ? 'bundle' : 'note'} — ${data.itemTitle}`

  try {
    await resend.emails.send({
      from,
      to: data.to,
      subject,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px">

    <div style="margin-bottom:28px">
      <span style="font-size:20px;font-weight:800;color:#f4f4f5">Aman<span style="color:#f97316">AI</span> Lab</span>
    </div>

    <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden">
      <div style="height:4px;background:linear-gradient(90deg,#f97316,#f59e0b)"></div>
      <div style="padding:32px">

        <div style="font-size:28px;margin-bottom:16px">${isMember ? '👑' : '🎉'}</div>
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f4f4f5;line-height:1.3">
          ${headline}
        </h1>
        <p style="margin:0 0 24px;font-size:14px;color:#a1a1aa;line-height:1.6">
          ${subtext}
        </p>

        <div style="background:#0f0f0f;border:1px solid #27272a;border-radius:10px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.05em">
            ${isMember ? 'Download Summary' : 'Order Summary'}
          </p>
          ${orderSummaryRows}
        </div>

        <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.05em">
          Your Download${data.items.length > 1 ? 's' : ''}
        </p>
        ${downloadLinks}

        <p style="margin:20px 0 0;font-size:12px;color:#52525b;line-height:1.7">
          Links expire in 24 hours — save your files now.<br>
          Need help? Reply to this email or write to
          <a href="mailto:amanchauhan7172@gmail.com" style="color:#f97316;text-decoration:none">amanchauhan7172@gmail.com</a>
        </p>

      </div>
    </div>

    <div style="margin-top:24px;text-align:center">
      <p style="margin:0;font-size:11px;color:#3f3f46">
        &copy; ${new Date().getFullYear()} AmanAI Lab
        ${isMember ? '&middot; Sent because you used a YouTube member code.' : '&middot; You received this because you made a purchase.'}
      </p>
    </div>

  </div>
</body>
</html>`,
    })
  } catch (err) {
    console.error('[send-receipt] email failed (non-blocking):', err)
  }
}
