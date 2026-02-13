<!DOCTYPE html>
<html lang="cs">

<head>
    <meta charset="UTF-8">
</head>

<body
    style="margin:0;padding:0;background-color:#0F0F0F;font-family:'Inter', sans-serif;color:#F1F1F1;text-align:center;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0F0F0F;">
        <tr>
            <td>
                <table width="600" cellpadding="0" cellspacing="0"
                    style="border-collapse:collapse;border:0;margin:30px auto;padding:20px;background-color:#0F0F0F;">
                    <tr>
                        <td style="padding-bottom:40px;">
                            <img src="https://iknowaspot.eu/techwatch_img/techwatch_logo_1.png" alt="TechWatch"
                                width="300" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <h2 style="margin:0 0 20px 0;">Máte novou zprávu!</h2>

                            <p style="margin:0 0 20px 0; line-height:1.6; font-size:16px;">
                                @if(isset($notification->data['tech_id']) && $notification->data['tech_id'])
                                    <strong>{{ $senderName }}</strong> má zájem o
                                    <strong>{{ $notification->tech_info['title'] ?? 'Vaši techniku' }}</strong>.
                                @elseif(isset($notification->data['is_job_offer']) && $notification->data['is_job_offer'])
                                    <strong>{{ $senderName }}</strong> Vám posílá pracovní nabídku.
                                @else
                                    <strong>{{ $senderName }}</strong> Vám posílá zprávu.
                                @endif
                            </p>

                            <p style="margin:30px 0;">
                                <a href="{{ $link }}"
                                    style="display:inline-block;padding:12px 32px;background-color:#B20300;color:#F1F1F1;text-decoration:none;font-weight:600;border-radius:12px;font-size:16px;">
                                    Zobrazit zprávu v aplikaci
                                </a>
                            </p>
                            <p style="margin-top:100px;font-size:12px;opacity:0.8;">
                                Pokud už práci nehledáte, můžete email ignorovat.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
