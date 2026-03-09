import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const FROM_ADDRESS = 'Taskle <noreply@taskle.ink>';

type Language = 'en' | 'ja';

interface EmailContent {
  subject: string;
  heading: string;
  body: string;
  cta: string;
}

function getEmailContent(type: string, lang: Language): EmailContent {
  const content: Record<string, Record<Language, EmailContent>> = {
    signup: {
      en: {
        subject: 'Verify your Taskle account',
        heading: 'Confirm your email address',
        body: 'Thanks for signing up for Taskle. Click the button below to verify your email address and get started.',
        cta: 'Verify email address',
      },
      ja: {
        subject: 'Taskleアカウントの確認',
        heading: 'メールアドレスの確認',
        body: 'Taskleにご登録いただきありがとうございます。下のボタンをクリックして、メールアドレスを確認し、始めましょう。',
        cta: 'メールアドレスを確認する',
      },
    },
    recovery: {
      en: {
        subject: 'Reset your Taskle password',
        heading: 'Reset your password',
        body: 'We received a request to reset the password for your Taskle account. Click the button below to choose a new password.',
        cta: 'Reset password',
      },
      ja: {
        subject: 'Taskleパスワードのリセット',
        heading: 'パスワードのリセット',
        body: 'Taskleアカウントのパスワードリセットのリクエストを受け付けました。下のボタンをクリックして、新しいパスワードを設定してください。',
        cta: 'パスワードをリセットする',
      },
    },
    email_change: {
      en: {
        subject: 'Confirm your email change',
        heading: 'Confirm new email address',
        body: 'You requested to change the email address on your Taskle account. Click the button below to confirm the new address.',
        cta: 'Confirm email change',
      },
      ja: {
        subject: 'メールアドレスの変更を確認',
        heading: '新しいメールアドレスの確認',
        body: 'Taskleアカウントのメールアドレス変更をリクエストしました。下のボタンをクリックして、新しいアドレスを確認してください。',
        cta: 'メールアドレスの変更を確認する',
      },
    },
  };

  const typeContent = content[type] ?? content['signup'];
  return typeContent[lang] ?? typeContent['ja'];
}

function buildEmailHtml(content: EmailContent, actionUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${content.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <span style="font-size:18px;font-weight:700;color:#37352f;letter-spacing:-0.3px;">Taskle</span>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#e8e8e6;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#37352f;line-height:1.3;letter-spacing:-0.3px;">${content.heading}</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#787774;line-height:1.6;">${content.body}</p>
              <a href="${actionUrl}"
                style="display:inline-block;background:#f35513;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;letter-spacing:0.1px;">
                ${content.cta}
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#e8e8e6;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0;font-size:12px;color:#adadaa;line-height:1.5;">
                If you didn't request this, you can safely ignore this email.<br />
                このメールに心当たりがない場合は、無視していただいて構いません。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: {
    user: {
      email: string;
      user_metadata?: { language?: string; display_name?: string };
    };
    email_data: {
      token: string;
      token_hash: string;
      redirect_to: string;
      email_action_type: string;
    };
  };

  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { user, email_data } = payload;
  const lang: Language =
    (user.user_metadata?.language as Language) === 'en' ? 'en' : 'ja';
  const type = email_data.email_action_type;

  const actionUrl = `${SUPABASE_URL}/auth/v1/verify?token=${email_data.token_hash}&type=${type}&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;

  const content = getEmailContent(type, lang);
  const html = buildEmailHtml(content, actionUrl);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [user.email],
      subject: content.subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    return new Response('Failed to send email', { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
